import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  try {
    const { sessionId, user } = getInfo(request)
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    // 添加验证：如果conversation_id为空，返回空数组而不是调用API
    if (!conversationId) {
      console.log('获取消息时缺少conversation_id参数，返回空数组')
      return NextResponse.json({ messages: [] }, {
        headers: setSession(sessionId),
      })
    }

    // 防止类似"answer-placeholder-xxx"这样的临时ID
    if (conversationId.includes('placeholder')) {
      console.log('检测到临时占位符ID，返回空数组:', conversationId)
      return NextResponse.json({ messages: [] }, {
        headers: setSession(sessionId),
      })
    }

    const { data }: any = await client.getConversationMessages(user, conversationId as string)
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  } catch (error: any) {
    console.error('获取消息失败:', error.response?.data || error.message)
    // 返回一个友好的错误响应，不会中断前端流程
    return NextResponse.json({ messages: [] }, { status: 200 })
  }
}
