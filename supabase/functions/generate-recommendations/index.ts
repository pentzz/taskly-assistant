import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user's tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    // Get user ID from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError) {
      console.error('Error getting user:', userError);
      throw userError;
    }

    // Generate recommendations based on tasks
    const recommendations = [];

    // Add urgent tasks recommendation
    const urgentTasks = tasks.filter(task => 
      task.due_date_type === 'urgent' && task.status !== 'completed'
    );
    if (urgentTasks.length > 0) {
      recommendations.push({
        content: 'יש לך משימות דחופות שדורשות טיפול מיידי',
        type: 'urgent',
        reasoning: 'משימות מסומנות כדחופות',
        user_id: user.id
      });
    }

    // Add overdue tasks recommendation
    const today = new Date();
    const overdueTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'completed' || task.due_date_type !== 'date') return false;
      const dueDate = new Date(task.due_date);
      return dueDate < today;
    });
    if (overdueTasks.length > 0) {
      recommendations.push({
        content: 'יש לך משימות שעברו את תאריך היעד',
        type: 'overdue',
        reasoning: 'משימות שעברו את תאריך היעד',
        user_id: user.id
      });
    }

    // Add motivational recommendation
    const completedTasks = tasks.filter(task => task.status === 'completed');
    if (completedTasks.length > 0) {
      recommendations.push({
        content: 'כל הכבוד! השלמת כבר ' + completedTasks.length + ' משימות',
        type: 'motivation',
        reasoning: 'עידוד על השלמת משימות',
        user_id: user.id
      });
    }

    // Delete old recommendations for this user
    const { error: deleteError } = await supabaseClient
      .from('recommendations')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting old recommendations:', deleteError);
      throw deleteError;
    }

    // Save new recommendations to the database
    if (recommendations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('recommendations')
        .insert(recommendations);

      if (insertError) {
        console.error('Error inserting recommendations:', insertError);
        throw insertError;
      }
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});