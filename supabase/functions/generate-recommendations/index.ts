import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get tasks for analysis
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })

    if (tasksError) throw tasksError

    const prompt = `
      בהתבסס על המשימות הבאות, צור המלצות בעברית לתעדוף וקיבוץ משימות. התייחס ל:
      - משימות בעדיפות גבוהה על פי תאריכי יעד וסטטוס
      - משימות שניתן לקבץ או להשלים יחד
      - הצעות לתזמון משימות ביעילות לאורך השבוע
      - הצע לפרק משימות גדולות (מעל 100 תווים בתיאור) למשימות קטנות יותר
      - כלול טיפים מוטיבציוניים

      המשימות:
      ${JSON.stringify(tasks, null, 2)}

      צור 3-5 המלצות ספציפיות. לכל המלצה, כלול גם הסבר מפורט לסיבה.
      ההמלצות צריכות להיות בעברית, והטקסט צריך להיות מסודר מימין לשמאל.
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'אתה עוזר שמנתח משימות ומספק המלצות מועילות בעברית.' },
          { role: 'user', content: prompt }
        ],
      }),
    })

    const data = await response.json()
    const recommendations = data.choices[0].message.content

    // Parse recommendations and store them
    const recommendationLines = recommendations.split('\n\n').filter(Boolean)
    
    for (const line of recommendationLines) {
      if (line.trim()) {
        const [content, reasoning] = line.split('\nהסבר: ')
        
        await supabaseClient
          .from('recommendations')
          .insert({
            content: content.trim(),
            reasoning: reasoning?.trim(),
            type: 'task_analysis'
          })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})