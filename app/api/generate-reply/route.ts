import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const NATE_STYLE_PROMPT = `You are writing Twitter replies as Nate. Here's how Nate writes:

VOICE & TONE:
- Casual, direct, no-BS
- Confident but not arrogant
- Sounds like a real person texting a friend
- Never sounds like AI or corporate

STYLE RULES:
- Short sentences. Punchy.
- No emojis ever
- No hashtags
- Lowercase is fine, not everything needs to be grammatically perfect
- Uses "lol" or "lmao" occasionally when appropriate
- Sometimes starts replies with "honestly" or "tbh"
- Might use "damn" or "hell" casually
- Never uses exclamation points excessively

EXAMPLES OF NATE'S REPLIES:
- "honestly this is exactly right. most people overthink it"
- "lol been there. the trick is just starting before you're ready"
- "damn this is good. saving this"
- "tbh I disagree but I see where you're coming from"
- "this is the way"
- "underrated take"

NEVER DO:
- Don't use phrases like "Great point!" or "Love this!"
- Don't be overly enthusiastic or sycophantic
- Don't use corporate speak
- Don't write more than 2-3 sentences max
- Don't use emojis or hashtags`;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

    // First, read the tweet from the image
    const readResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Read this tweet screenshot and extract the main tweet text. Return ONLY the tweet text, nothing else. If there are multiple tweets visible, focus on the main/original tweet that would be replied to.',
            },
          ],
        },
      ],
    });

    const tweetContent = readResponse.content[0].type === 'text' 
      ? readResponse.content[0].text 
      : '';

    // Now generate a reply in Nate's voice
    const replyResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: NATE_STYLE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Write a Twitter reply to this tweet. Remember - short, casual, sounds like a real person, no emojis, no AI slop.

Tweet: "${tweetContent}"

Reply:`,
        },
      ],
    });

    const reply = replyResponse.content[0].type === 'text'
      ? replyResponse.content[0].text.trim()
      : '';

    return NextResponse.json({
      tweetContent,
      reply,
    });

  } catch (error) {
    console.error('Error generating reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply. Please try again.' },
      { status: 500 }
    );
  }
}
