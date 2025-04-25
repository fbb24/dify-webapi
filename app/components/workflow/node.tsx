'use client'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import cn from 'classnames'
import BlockIcon from './block-icon'
import AlertCircle from '@/app/components/base/icons/line/alert-circle'
import AlertTriangle from '@/app/components/base/icons/line/alert-triangle'
import Loading02 from '@/app/components/base/icons/line/loading-02'
import CheckCircle from '@/app/components/base/icons/line/check-circle'
import type { NodeTracing } from '@/types/app'
import { Markdown } from '@/app/components/base/markdown'

type Props = {
  nodeInfo: NodeTracing
  hideInfo?: boolean
}
const NodePanel: FC<Props> = ({ nodeInfo, hideInfo = false }) => {
  const [collapseState, setCollapseState] = useState<boolean>(true)

  if (nodeInfo.node_type !== 'llm') {
    console.log(`跳过渲染非LLM节点: ${nodeInfo.title} (类型: ${nodeInfo.node_type})`);
    return null;
  }

  const getTime = (time: number) => {
    if (time < 1)
      return `${(time * 1000).toFixed(3)} ms`
    if (time > 60)
      return `${parseInt(Math.round(time / 60).toString())} m ${(time % 60).toFixed(3)} s`
    return `${time.toFixed(3)} s`
  }

  const getTokenCount = (tokens: number) => {
    if (tokens < 1000)
      return tokens
    if (tokens >= 1000 && tokens < 1000000)
      return `${parseFloat((tokens / 1000).toFixed(3))}K`
    if (tokens >= 1000000)
      return `${parseFloat((tokens / 1000000).toFixed(3))}M`
  }

  useEffect(() => {
    setCollapseState(!nodeInfo.expand)
  }, [nodeInfo.expand])

  return (
    <div className={cn('px-4 py-1', hideInfo && '!p-0')}>
      <div className={cn('group transition-all bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md', hideInfo && '!rounded-lg')}>
        <div
          className={cn(
            'flex items-center pl-[6px] pr-3 cursor-pointer',
            hideInfo ? 'py-2' : 'py-3',
            !collapseState && (hideInfo ? '!pb-1' : '!pb-2'),
          )}
          onClick={() => setCollapseState(!collapseState)}
        >
          <BlockIcon size={hideInfo ? 'xs' : 'sm'} className={cn('shrink-0 mr-2', hideInfo && '!mr-1')} type={nodeInfo.node_type} toolIcon={nodeInfo.extras?.icon || nodeInfo.extras} />
          <div className={cn(
            'grow text-gray-700 text-[13px] leading-[16px] font-semibold truncate',
            hideInfo && '!text-xs',
          )} title={nodeInfo.title}>{nodeInfo.title}</div>

          {/* 添加下拉箭头 */}
          <div className={cn(
            'ml-2 transition-transform',
            !collapseState && 'transform rotate-180'
          )}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {nodeInfo.status !== 'running' && !hideInfo && (
            <div className='shrink-0 text-gray-500 text-xs leading-[18px]'>{`${getTime(nodeInfo.elapsed_time || 0)} · ${getTokenCount(nodeInfo.execution_metadata?.total_tokens || 0)} tokens`}</div>
          )}
          {nodeInfo.status === 'succeeded' && (
            <CheckCircle className='shrink-0 ml-2 w-3.5 h-3.5 text-[#12B76A]' />
          )}
          {nodeInfo.status === 'failed' && (
            <AlertCircle className='shrink-0 ml-2 w-3.5 h-3.5 text-[#F04438]' />
          )}
          {nodeInfo.status === 'stopped' && (
            <AlertTriangle className='shrink-0 ml-2 w-3.5 h-3.5 text-[#F79009]' />
          )}
          {nodeInfo.status === 'running' && (
            <div className='shrink-0 flex items-center text-primary-600 text-[13px] leading-[16px] font-medium'>
              <Loading02 className='mr-1 w-3.5 h-3.5 animate-spin' />
              <span>Running</span>
            </div>
          )}
        </div>

        {/* 展开内容区域 */}
        {!collapseState && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-2 mt-1">
            <div className="max-h-[300px] overflow-y-auto" id={`node-content-${nodeInfo.id}`}>
              {nodeInfo.process_data ? (
                typeof nodeInfo.process_data === 'string' ? (
                  // 如果是字符串，直接渲染为Markdown
                  <Markdown content={nodeInfo.process_data} />
                ) : (
                  // 如果是对象或数组，格式化为JSON字符串
                  <Markdown content={`\`\`\`json\n${JSON.stringify(nodeInfo.process_data, null, 2)}\n\`\`\``} />
                )
              ) : (
                // 如果没有数据，显示加载状态或提示
                <div className="text-sm text-center text-gray-500 py-4">
                  {nodeInfo.status === 'running' ? (
                    <div className="flex items-center justify-center">
                      <Loading02 className="mr-1 w-3.5 h-3.5 animate-spin" />
                      <span>正在处理...</span>
                    </div>
                  ) : (
                    <span>此节点没有输出内容</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NodePanel