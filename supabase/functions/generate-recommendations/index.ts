import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError) {
      throw userError;
    }

    // Delete existing recommendations
    const { error: deleteError } = await supabaseClient
      .from('recommendations')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    // Get active tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    if (tasksError) {
      throw tasksError;
    }

    const recommendations = [];

    // If no active tasks, return a motivational message
    if (!tasks || tasks.length === 0) {
      recommendations.push({
        content: "נראה שאין לך משימות פתוחות כרגע. זה הזמן המושלם להתחיל משהו חדש! אשמח לעזור לך לתעדף ולתכנן את המשימות הבאות שלך.",
        type: 'motivation',
        user_id: user.id
      });
    } else {
      console.log('Tasks found:', tasks);

      // Generate AI recommendations based on tasks
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `אתה עוזר אישי שנותן המלצות קצרות ומוטיבציה בעברית. עליך:
              1. לנתח את המשימות ולתת המלצה קצרה וממוקדת (עד 2 משפטים)
              2. להתייחס למשימות הדחופות ביותר קודם
              3. לתת מוטיבציה מותאמת אישית בהתבסס על תוכן המשימות
              4. להיות תמציתי וברור
              5. להתייחס לתוכן המשימה ולתת טיפים רלוונטיים
              6. לשים לב במיוחד למשימות שמסומנות כדחופות
              7. לא לציין שאין לך גישה למשימות - המשימות מועברות אליך בפורמט JSON`
            },
            {
              role: 'user',
              content: `אנא נתח את המשימות הבאות ותן המלצה קצרה ומוטיבציה: ${JSON.stringify(tasks, null, 2)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        }),
      });

      const aiData = await openAIResponse.json();
      console.log('AI Response:', aiData);

      if (aiData.error) {
        throw new Error(`OpenAI API error: ${aiData.error.message}`);
      }

      // Add the AI-generated recommendation
      recommendations.push({
        content: aiData.choices[0].message.content,
        type: tasks.some(t => t.due_date_type === 'urgent') ? 'urgent' : 'motivation',
        user_id: user.id,
        reasoning: 'המלצה מותאמת אישית מבוססת AI'
      });
    }

    // Save new recommendations
    if (recommendations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('recommendations')
        .insert(recommendations);

      if (insertError) {
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