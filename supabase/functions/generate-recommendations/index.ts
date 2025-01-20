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

    // Get user ID from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError) {
      throw userError
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

    // Check for urgent tasks
    const urgentTasks = tasks.filter(task => 
      task.due_date_type === 'urgent' || task.due_date_type === 'asap'
    )
    if (urgentTasks.length > 0) {
      recommendations.push({
        content: `יש ${urgentTasks.length} משימות דחופות שדורשות את תשומת לבך`,
        type: 'urgent',
        reasoning: 'משימות מסומנות כדחופות',
        user_id: user.id
      })
    }

    // Check for overdue tasks
    const today = new Date()
    const overdueTasks = tasks.filter(task => {
      if (!task.due_date || task.due_date_type !== 'date') return false
      const dueDate = new Date(task.due_date)
      return dueDate < today
    })
    if (overdueTasks.length > 0) {
      recommendations.push({
        content: `${overdueTasks.length} משימות עברו את תאריך היעד`,
        type: 'overdue',
        reasoning: 'משימות שעברו את תאריך היעד',
        user_id: user.id
      })
    }

    // Add motivation for completed tasks
    const { data: completedTasks } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (completedTasks && completedTasks.length > 0) {
      recommendations.push({
        content: `כל הכבוד! השלמת ${completedTasks.length} משימות`,
        type: 'motivation',
        reasoning: 'עידוד על השלמת משימות',
        user_id: user.id
      })
    }

    // Delete old recommendations
    const { error: deleteError } = await supabaseClient
      .from('recommendations')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      throw deleteError
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