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
      
      const { error: insertError } = await supabaseClient
        .from('recommendations')
        .insert(recommendations)

      if (insertError) {
        throw insertError
      }

      return new Response(JSON.stringify({ recommendations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for urgent tasks (due within 2 days)
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    
    const urgentTasks = tasks.filter(task => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      return dueDate <= twoDaysFromNow
    })

    if (urgentTasks.length > 0) {
      recommendations.push({
        content: `יש ${urgentTasks.length} משימות דחופות שצריך לטפל בהן בימים הקרובים!`,
        type: 'urgent',
        user_id: user.id
      })
    }

    // Check for overdue tasks
    const today = new Date()
    const overdueTasks = tasks.filter(task => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      return dueDate < today
    })

    if (overdueTasks.length > 0) {
      recommendations.push({
        content: `${overdueTasks.length} משימות עברו את תאריך היעד. כדאי לטפל בהן בהקדם!`,
        type: 'overdue',
        user_id: user.id
      })
    }

    // If we have tasks but none are urgent or overdue, add a general recommendation
    if (recommendations.length === 0 && tasks.length > 0) {
      recommendations.push({
        content: `יש לך ${tasks.length} משימות פתוחות. בוא נתקדם איתן בקצב שלך!`,
        type: 'motivation',
        user_id: user.id
      })
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