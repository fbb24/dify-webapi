import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import RemarkMath from 'remark-math'
import RemarkBreaks from 'remark-breaks'
import RehypeKatex from 'rehype-katex'
import RemarkGfm from 'remark-gfm'
import RehypeRaw from 'rehype-raw'
import SyntaxHighlighter from 'react-syntax-highlighter'
import {
  atelierHeathDark,
  atelierHeathLight,
} from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { Component, memo, useMemo, useRef, useState } from 'react'
import { flow } from 'lodash-es'
import cn from '@/utils/classnames'


// Available language https://github.com/react-syntax-highlighter/react-syntax-highlighter/blob/master/AVAILABLE_LANGUAGES_HLJS.MD
const capitalizationLanguageNameMap: Record<string, string> = {
  sql: 'SQL',
  javascript: 'JavaScript',
  java: 'Java',
  typescript: 'TypeScript',
  vbscript: 'VBScript',
  css: 'CSS',
  html: 'HTML',
  xml: 'XML',
  php: 'PHP',
  python: 'Python',
  yaml: 'Yaml',
  mermaid: 'Mermaid',
  markdown: 'MarkDown',
  makefile: 'MakeFile',
  shell: 'Shell',
  powershell: 'PowerShell',
  json: 'JSON',
  latex: 'Latex',
  svg: 'SVG',
}
const getCorrectCapitalizationLanguageName = (language: string) => {
  if (!language)
    return 'Plain'

  if (language in capitalizationLanguageNameMap)
    return capitalizationLanguageNameMap[language]

  return language.charAt(0).toUpperCase() + language.substring(1)
}

const preprocessLaTeX = (content: string) => {
  if (typeof content !== 'string')
    return content

  const codeBlockRegex = /```[\s\S]*?```/g
  const codeBlocks = content.match(codeBlockRegex) || []
  let processedContent = content.replace(codeBlockRegex, 'CODE_BLOCK_PLACEHOLDER')

  processedContent = flow([
    (str: string) => str.replace(/\\\[(.*?)\\\]/g, (_, equation) => `$$${equation}$$`),
    // 修复：替换有s标志的正则表达式
    (str: string) => str.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => `$$${equation}$$`),
    (str: string) => str.replace(/\\\((.*?)\\\)/g, (_, equation) => `$$${equation}$$`),
    (str: string) => str.replace(/(^|[^\\])\$(.+?)\$/g, (_, prefix, equation) => `${prefix}$${equation}$`),
  ])(processedContent)

  codeBlocks.forEach((block) => {
    processedContent = processedContent.replace('CODE_BLOCK_PLACEHOLDER', block)
  })

  return processedContent
}

const preprocessThinkTag = (content: string) => {
  return flow([
    (str: string) => str.replace('<think>\n', '<details data-think=true>\n'),
    (str: string) => str.replace('\n</think>', '\n[ENDTHINKFLAG]</details>'),
  ])(content)
}

export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null)

  return (
    <pre ref={ref}>
      <span
        className="copy-code-button"
      ></span>
      {props.children}
    </pre>
  )
}

// **Add code block
// Avoid error #185 (Maximum update depth exceeded.
// This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
// React limits the number of nested updates to prevent infinite loops.)
// Reference A: https://reactjs.org/docs/error-decoder.html?invariant=185
// Reference B1: https://react.dev/reference/react/memo
// Reference B2: https://react.dev/reference/react/useMemo
// ****
// The original error that occurred in the streaming response during the conversation:
// Error: Minified React error 185;
// visit https://reactjs.org/docs/error-decoder.html?invariant=185 for the full message
// or use the non-minified dev environment for full errors and additional helpful warnings.

const CodeBlock = memo(({ inline, className, children, ...props }: any) => {
  // const { theme } = useTheme()
  const [isSVG, setIsSVG] = useState(true)
  const match = /language-(\w+)/.exec(className || '')
  const language = match?.[1]
  const languageShowName = getCorrectCapitalizationLanguageName(language || '')

  const content = String(children).replace(/\n$/, '')

  // 检查是否是SVG内容
  if (language === 'svg' && isSVG) {
    return (
      <ErrorBoundary>
        {/* <SVGRenderer content={content} /> */}
      </ErrorBoundary>
    )
  }

  // 内联代码或无语言标记的代码
  if (inline || !match)
    return <code {...props} className={className}>{children}</code>

  // 代码块
  return (
    <div className='relative'>
      <div className='flex h-8 items-center justify-between rounded-t-[10px] border-b border-divider-subtle bg-components-input-bg-normal p-1 pl-3'>
        <div className='system-xs-semibold-uppercase text-text-secondary'>{languageShowName}</div>
        {/* <div className='flex items-center gap-1'>
        {(['mermaid', 'svg']).includes(language!) && <SVGBtn isSVG={isSVG} setIsSVG={setIsSVG} />}
        <ActionButton>
          <CopyIcon content={String(children).replace(/\n$/, '')} />
        </ActionButton>
      </div> */}
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={atelierHeathLight}
        showLineNumbers={true}
        wrapLines={true}
        customStyle={{ margin: 0, borderRadius: '0 0 10px 10px' }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

const VideoBlock: any = memo(({ node }: any) => {
  const srcs = node.children.filter((child: any) => 'properties' in child).map((child: any) => (child as any).properties.src)
  if (srcs.length === 0)
    return null
  // return <VideoGallery key={srcs.join()} srcs={srcs} />
  return <div>{srcs}</div>
})
VideoBlock.displayName = 'VideoBlock'

const AudioBlock: any = memo(({ node }: any) => {
  const srcs = node.children.filter((child: any) => 'properties' in child).map((child: any) => (child as any).properties.src)
  if (srcs.length === 0)
    return null
  // return <AudioGallery key={srcs.join()} srcs={srcs} />
  return <div>{srcs}</div>
})
AudioBlock.displayName = 'AudioBlock'

const ScriptBlock = memo(({ node }: any) => {
  const scriptContent = node.children[0]?.value || ''
  return <>{`<script>${scriptContent}</script>`}</>
})
ScriptBlock.displayName = 'ScriptBlock'

const Paragraph = (paragraph: any) => {
  const { node }: any = paragraph
  const children_node = node.children
  if (children_node && children_node[0] && 'tagName' in children_node[0] && children_node[0].tagName === 'img') {
    return (
      <div className="markdown-img-wrapper">
        {/* <ImageGallery srcs={[children_node[0].properties.src]} /> */}
        <div> {[children_node[0].properties.src]} </div>
        {
          Array.isArray(paragraph.children) && paragraph.children.length > 1 && (
            <div className="mt-2">{paragraph.children.slice(1)}</div>
          )
        }
      </div>
    )
  }
  return <p>{paragraph.children}</p>
}

const Img = ({ src }: any) => {
  return <div className="markdown-img-wrapper">
    {/* <ImageGallery srcs={[src]} /> */}
    {[src]}
  </div>
}

const Link = ({ node, ...props }: any) => {
  if (node.properties?.href && node.properties.href?.toString().startsWith('abbr')) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    // const { onSend } = useChatContext()

    const hidden_text = decodeURIComponent(node.properties.href.toString().split('abbr:')[1])
    console.log('【调试信息】abbr链接的title值:', node.children[0]?.value);
    return <abbr className="cursor-pointer underline !decoration-primary-700 decoration-dashed" onClick={() =>
      // onSend?.(hidden_text)
      hidden_text
    }

      title={node.children[0]?.value}>{node.children[0]?.value}</abbr>
  }
  else {
    return <a {...props} target="_blank" className="cursor-pointer underline !decoration-primary-700 decoration-dashed">{node.children[0] ? node.children[0]?.value : 'Download'}</a>
  }
}

export function Markdown(props: { content: string; className?: string; customDisallowedElements?: string[] }) {
  const latexContent = flow([
    preprocessThinkTag,
    preprocessLaTeX,
  ])(props.content)

  return (
    <div className={cn('markdown-body', '!text-text-primary', props.className)}>
      <ReactMarkdown
        remarkPlugins={[
          RemarkGfm,
          [RemarkMath, { singleDollarTextMath: false }],
          RemarkBreaks,
        ]}
        rehypePlugins={[
          RehypeKatex,
          RehypeRaw as any,
          // The Rehype plug-in is used to remove the ref attribute of an element
          () => {
            return (tree) => {
              const iterate = (node: any) => {
                if (node.type === 'element' && node.properties?.ref)
                  delete node.properties.ref

                if (node.type === 'element' && !/^[a-z][a-z0-9]*$/i.test(node.tagName)) {
                  node.type = 'text'
                  node.value = `<${node.tagName}`
                }

                if (node.children)
                  node.children.forEach(iterate)
              }
              tree.children.forEach(iterate)
            }
          },
        ]}
        disallowedElements={['iframe', 'head', 'html', 'meta', 'link', 'style', 'body', ...(props.customDisallowedElements || [])]}
        components={{
          code: CodeBlock,
          img: Img,
          video: VideoBlock,
          audio: AudioBlock,
          a: Link,
          p: Paragraph,
          // button: MarkdownButton,
          // form: MarkdownForm,
          script: ScriptBlock as any,
        }}
      >
        {/* Markdown detect has problem. */}
        {latexContent}
      </ReactMarkdown>
    </div>
  )
}

// **Add an ECharts runtime error handler
// Avoid error #7832 (Crash when ECharts accesses undefined objects)
// This can happen when a component attempts to access an undefined object that references an unregistered map, causing the program to crash.

export default class ErrorBoundary extends Component {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ hasError: true })
    console.error(error, errorInfo)
  }

  render() {
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    if (this.state.hasError)
      return <div>Oops! An error occurred. This could be due to an ECharts runtime error or invalid SVG content. <br />(see the browser console for more information)</div>
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    return this.props.children
  }
}