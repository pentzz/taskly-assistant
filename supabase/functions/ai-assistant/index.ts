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
    const { prompt, type, taskData } = await req.json()

    let systemPrompt = ''
    switch (type) {
      case 'prioritize':
        systemPrompt = `You are a helpful task management assistant. Analyze the following tasks and suggest priorities based on due dates and status. Respond in Hebrew.`
        break
      case 'split':
        systemPrompt = `You are a task breakdown specialist. Break down the following task into smaller, actionable steps. Respond in Hebrew.`
        break
      case 'motivate':
        systemPrompt = `You are an encouraging assistant. Provide a motivational message in Hebrew for completing a task.`
        break
      default:
        systemPrompt = `You are a helpful task management assistant. Answer questions about tasks and provide guidance in Hebrew.`
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