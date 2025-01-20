import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError) {
      throw userError
    }

    // Delete existing recommendations for this user
    const { error: deleteError } = await supabaseClient
      .from('recommendations')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      throw deleteError
    }

    // Get active tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .order('due_date', { ascending: true })

    if (tasksError) {
      throw tasksError
    }

    const recommendations = []

    // If no active tasks, return a motivational message
    if (!tasks || tasks.length === 0) {
      recommendations.push({
        content: "כל הכבוד! אין לך משימות פתוחות כרגע. זה הזמן ליצור משימות חדשות!",
        type: 'motivation',
        user_id: user.id
      })
    } else {
      // Check for urgent tasks
      const urgentTasks = tasks.filter(task => 
        task.due_date_type === 'urgent' || 
        task.due_date_type === 'asap'
      )

      if (urgentTasks.length > 0) {
        urgentTasks.forEach(task => {
          recommendations.push({
            content: `המשימה "${task.title}" מסומנת כדחופה - כדאי לטפל בה בהקדם!`,
            type: 'urgent',
            user_id: user.id,
            reasoning: `משימה זו הוגדרה כ${task.due_date_type === 'urgent' ? 'דחופה' : 'לביצוע בהקדם'}`
          })
        })
      }

      // Check for tasks due today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayTasks = tasks.filter(task => {
        if (!task.due_date || task.due_date_type !== 'date') return false
        const taskDate = new Date(task.due_date)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() === today.getTime()
      })

      if (todayTasks.length > 0) {
        todayTasks.forEach(task => {
          recommendations.push({
            content: `המשימה "${task.title}" מתוכננת להיום - זה הזמן לטפל בה!`,
            type: 'overdue',
            user_id: user.id,
            reasoning: 'משימה זו מתוכננת להיום'
          })
        })
      }

      // Check for overdue tasks
      const overdueTasks = tasks.filter(task => {
        if (!task.due_date || task.due_date_type !== 'date') return false
        const taskDate = new Date(task.due_date)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate < today
      })

      if (overdueTasks.length > 0) {
        overdueTasks.forEach(task => {
          recommendations.push({
            content: `המשימה "${task.title}" עברה את תאריך היעד - כדאי לטפל בה בדחיפות!`,
            type: 'overdue',
            user_id: user.id,
            reasoning: 'משימה זו עברה את תאריך היעד'
          })
        })
      }

      // If we have tasks but none are urgent/overdue/today, add a general recommendation
      if (recommendations.length === 0) {
        const tasksList = tasks.map(task => `"${task.title}"`).join(', ')
        recommendations.push({
          content: `יש לך ${tasks.length} משימות פתוחות: ${tasksList}. בוא נתקדם איתן בקצב שלך!`,
          type: 'motivation',
          user_id: user.id,
          reasoning: 'סקירה כללית של המשימות הפתוחות'
        })
      }
    }

    // Save new recommendations
    if (recommendations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('recommendations')
        .insert(recommendations)

      if (insertError) {
        throw insertError
      }
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in generate-recommendations function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})