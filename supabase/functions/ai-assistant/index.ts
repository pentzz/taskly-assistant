import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, type, taskData, userName } = await req.json()

    let systemPrompt = ''
    if (type === 'initial') {
      systemPrompt = `אתה עוזר אישי ידידותי שמדבר בעברית. אתה צריך להציג את עצמך ולשאול את המשתמש מה שמו. השתמש בשפה חמה ונעימה.`
    } else if (type === 'tasks') {
      systemPrompt = `אתה עוזר אישי ידידותי שמדבר בעברית. אתה מנתח משימות ומציג אותן בצורה ברורה ונעימה. כשאתה מציג משימות:
      - השתמש בתגית <b> להדגשת טקסט חשוב
      - הצג את המידע בצורה מסודרת עם רווחים ושורות חדשות
      - התייחס למשתמש בשמו אם ידוע לך (${userName})
      - הצע עזרה נוספת בסוף`
    } else {
      systemPrompt = `אתה עוזר אישי ידידותי שמדבר בעברית. אתה עוזר למשתמש ${userName || ''} לנהל את המשימות שלו ביעילות.`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
          ...(taskData ? [{ role: 'user', content: JSON.stringify(taskData) }] : []),
        ],
      }),
    })

    const data = await response.json()
    return new Response(JSON.stringify({ response: data.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})