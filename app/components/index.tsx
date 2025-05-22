/* eslint-disable @typescript-eslint/no-use-before-define */
'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import ConfigSence from '@/app/components/config-scence'
import Header from '@/app/components/header'
import { fetchAppParams, fetchChatList, fetchConversations, generationConversationName, sendChatMessage, updateFeedback } from '@/service'
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import { setLocaleOnClient } from '@/i18n/client'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import AppUnavailable from '@/app/components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'
import { useModelId } from '@/app/components/welcome/index'
import Login from '@/app/components/login'
import { useRouter } from 'next/navigation' // 添加路由导入
import Welcome from './welcome'

export type IMainProps = {
  params: any
}

const Main: FC<IMainProps> = () => {
  const { t } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const hasSetAppConfig = APP_ID && API_KEY
  const router = useRouter() // 获取路由实例

  /*
  * app info
  */
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  // in mobile, show sidebar by click button
  const [isShowSidebar, { setTrue: showSidebar, setFalse: hideSidebar }] = useBoolean(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: true,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  useEffect(() => {
    if (APP_INFO?.title)
      document.title = `${APP_INFO.title} - Powered by Dify`
  }, [APP_INFO?.title])

  // onData change thought (the produce obj). https://github.com/immerjs/immer/issues/576
  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  /*
  * conversation info
  */
  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    isNewConversation,
    currConversationInfo,
    currInputs,
    newConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)
  const handleStartChat = (inputs: Record<string, any>) => {
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrInputs(inputs)
    setChatStarted()
    // parse variables in introduction
    setChatList(generateNewChatListWithOpenStatement('', inputs))
  }
  const hasSetInputs = (() => {
    if (!isNewConversation)
      return true

    return isChatStarted
  })()

  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  const conversationIntroduction = currConversationInfo?.introduction || ''

  const handleConversationSwitch = () => {
    if (!inited)
      return

    // update inputs of current conversation
    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      const item = conversationList.find(item => item.id === currConversationId)
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        name: item?.name || '',
        introduction: notSyncToStateIntroduction,
      })
    }
    else {
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
    }

    // update chat list of current conversation
    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding) {
      fetchChatList(currConversationId).then((res: any) => {
        const { data } = res
        const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs)

        data.forEach((item: any) => {
          newChatList.push({
            id: `question-${item.id}`,
            content: item.query,
            isAnswer: false,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],
          })
          newChatList.push({
            id: item.id,
            content: item.answer,
            agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
            feedback: item.feedback,
            isAnswer: true,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
          })
        })
        setChatList(newChatList)
      })
    }

    if (isNewConversation && isChatStarted)
      setChatList(generateNewChatListWithOpenStatement())
  }
  useEffect(handleConversationSwitch, [currConversationId, inited])

  const handleConversationIdChange = (id: string) => {
    if (id === '-1') {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    // trigger handleConversationSwitch
    setCurrConversationId(id, APP_ID)
    hideSidebar()
  }

  /*
  * chat info. chat is under conversation.
  */
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const chatListDomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // scroll to bottom
    if (chatListDomRef.current)
      chatListDomRef.current.scrollTop = chatListDomRef.current.scrollHeight
  }, [chatList, currConversationId])
  // user can not edit inputs if user had send message
  const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
  const createNewChat = () => {
    // if new chat is already exist, do not create new chat
    if (conversationList.some(item => item.id === '-1'))
      return

    setConversationList(produce(conversationList, (draft) => {
      draft.unshift({
        id: '-1',
        name: t('app.chat.newChatDefaultName'),
        inputs: newConversationInputs,
        introduction: conversationIntroduction,
      })
    }))
  }

  // sometime introduction is not applied to state
  const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null) => {
    let calculatedIntroduction = introduction || conversationIntroduction || ''
    const calculatedPromptVariables = inputs || currInputs || null
    if (calculatedIntroduction && calculatedPromptVariables)
      calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables)

    const openStatement = {
      id: `${Date.now()}`,
      content: calculatedIntroduction,
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: isShowPrompt,
    }
    if (calculatedIntroduction)
      return [openStatement]

    return []
  }

  // init
  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(), fetchAppParams()])
        // handle current conversation id
        const { data: conversations, error } = conversationData as { data: ConversationItem[]; error: string }
        if (error) {
          Toast.notify({ type: 'error', message: error })
          throw new Error(error)
          return
        }
        const _conversationId = getConversationIdFromStorage(APP_ID)
        const isNotNewConversation = conversations.some(item => item.id === _conversationId)

        // fetch new conversation info
        const { user_input_form, opening_statement: introduction, file_upload, system_parameters }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
        })
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)
        setVisionConfig({
          ...file_upload?.image,
          enabled: true,
          image_file_size_limit: system_parameters?.system_parameters || 0,
        });
        setConversationList(conversations as ConversationItem[])

        if (isNotNewConversation)
          setCurrConversationId(_conversationId, APP_ID, false)

        setInited(true)
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknownReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, [])

  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const checkCanSend = () => {
    if (currConversationId !== '-1')
      return true

    if (!currInputs || !promptConfig?.prompt_variables)
      return true

    const inputLens = Object.values(currInputs).length
    const promptVariablesLens = promptConfig.prompt_variables.length

    const emptyInput = inputLens < promptVariablesLens || Object.values(currInputs).find(v => !v)
    if (emptyInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const [controlFocus, setControlFocus] = useState(0)
  const [openingSuggestedQuestions, setOpeningSuggestedQuestions] = useState<string[]>([])
  const [messageTaskId, setMessageTaskId] = useState('')
  const [hasStopResponded, setHasStopResponded, getHasStopResponded] = useGetState(false)
  const [isRespondingConIsCurrCon, setIsRespondingConCurrCon, getIsRespondingConIsCurrCon] = useGetState(true)
  const [userQuery, setUserQuery] = useState('')

  const updateCurrentQA = ({
    responseItem,
    questionId,
    placeholderAnswerId,
    questionItem,
  }: {
    responseItem: ChatItem
    questionId: string
    placeholderAnswerId: string
    questionItem: ChatItem
  }) => {
    // closesure new list is outdated.
    const newListWithAnswer = produce(
      getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
      (draft) => {
        if (!draft.find(item => item.id === questionId))
          draft.push({ ...questionItem })

        draft.push({ ...responseItem })
      })
    setChatList(newListWithAnswer)
  }

  const transformToServerFile = (fileItem: any) => {
    return {
      type: 'image',
      transfer_method: fileItem.transferMethod,
      url: fileItem.url,
      upload_file_id: fileItem.id,
    }
  }

  const { modelId } = useModelId(); // 获取当前选择的模型ID

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }

    const toServerInputs: Record<string, any> = {}
    if (currInputs) {
      Object.keys(currInputs).forEach((key) => {
        const value = currInputs[key]  // 获取每个键对应的值

        if (value.supportFileType)  // 如果是单个文件类型
          toServerInputs[key] = transformToServerFile(value)  // 转换为服务器需要的文件格式

        else if (value[0]?.supportFileType)  // 如果是文件数组
          toServerInputs[key] = value.map((item: any) => transformToServerFile(item))  // 转换每个文件

        else  // 如果是普通值(文本、数字等)
          toServerInputs[key] = value  // 直接使用原始值
      })
    }

    const data: Record<string, any> = {
      inputs: toServerInputs,

      // 在 query 前拼接模型ID (0 或 1)
      query: `${modelId}${message}`,
      conversation_id: isNewConversation ? null : currConversationId,
    }

    if (visionConfig?.enabled && files && files?.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    // question显示原始消息，不添加modelId前缀
    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,  // 这里保持原始消息，不添加前缀
      isAnswer: false,
      message_files: files,
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    let isAgentMode = false

    // answer
    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    let hasSetResponseId = false

    const prevTempNewConversationId = getCurrConversationId() || '-1'
    let tempNewConversationId = ''

    setRespondingTrue()
    sendChatMessage(data, {
      getAbortController: (abortController) => {
        setAbortController(abortController)
      },
      onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
        if (!isAgentMode) {
          responseItem.content = responseItem.content + message
        }
        else {
          const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
          if (lastThought)
            lastThought.thought = lastThought.thought + message // need immer setAutoFreeze
        }
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (isFirstMessage && newConversationId)
          tempNewConversationId = newConversationId

        setMessageTaskId(taskId)
        // has switched to other conversation
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return
        }
        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      async onCompleted(hasError?: boolean) {
        if (hasError)
          return

        if (getConversationIdChangeBecauseOfNew()) {
          const { data: allConversations }: any = await fetchConversations()
          const newItem: any = await generationConversationName(allConversations[0].id)

          const newAllConversations = produce(allConversations, (draft: any) => {
            draft[0].name = newItem.name
          })
          setConversationList(newAllConversations as any)
        }
        setConversationIdChangeBecauseOfNew(false)
        resetNewConversationInputs()
        setChatNotStarted()
        setCurrConversationId(tempNewConversationId, APP_ID, true)
        setRespondingFalse()
      },
      onFile(file) {
        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought)
          lastThought.message_files = [...(lastThought as any).message_files, { ...file }]

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onThought(thought) {
        isAgentMode = true
        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        // responseItem.id = thought.message_id;
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          // thought changed but still the same thought, so update.
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        // has switched to other conversation
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return false
        }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onMessageEnd: (messageEnd) => {
        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
          const newListWithAnswer = produce(
            getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
            (draft) => {
              if (!draft.find(item => item.id === questionId))
                draft.push({ ...questionItem })

              draft.push({
                ...responseItem,
              })
            })
          setChatList(newListWithAnswer)
          return
        }
        // not support show citation
        // responseItem.citation = messageEnd.retriever_resources
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId))
              draft.push({ ...questionItem })

            draft.push({ ...responseItem })
          })
        setChatList(newListWithAnswer)
      },
      onMessageReplace: (messageReplace) => {
        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)

            if (current)
              current.content = messageReplace.answer
          },
        ))
      },
      onError() {
        setRespondingFalse()
        // role back placeholder answer
        setChatList(produce(getChatList(), (draft) => {
          draft.splice(draft.findIndex(item => item.id === placeholderAnswerId), 1)
        }))
      },
      onWorkflowStarted: ({ workflow_run_id, task_id }) => {
        // taskIdRef.current = task_id
        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onWorkflowFinished: ({ data }) => {
        responseItem.workflowProcess!.status = data.status as WorkflowRunningStatus
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeStarted: ({ data }) => {
        responseItem.workflowProcess!.tracing!.push(data as any)
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeFinished: ({ data }) => {
        const currentIndex = responseItem.workflowProcess!.tracing!.findIndex(item => item.node_id === data.node_id)
        responseItem.workflowProcess!.tracing[currentIndex] = data as any
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
    })
  }

  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    const newChatList = chatList.map((item) => {
      if (item.id === messageId) {
        return {
          ...item,
          feedback,
        }
      }
      return item
    })
    setChatList(newChatList)
    notify({ type: 'success', message: t('common.api.success') })
  }

  const renderSidebar = () => {
    if (!APP_ID || !APP_INFO || !promptConfig)
      return null
    return (
      <Sidebar
        list={conversationList}
        onCurrentIdChange={handleConversationIdChange}
        currentId={currConversationId}
        copyRight={APP_INFO.copyright || APP_INFO.title}
      />
    )
  }

  // 添加登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  // 添加一个状态，用于区分是否显示 Welcome 组件
  const [showWelcome, setShowWelcome] = useState(false)

  // 检查用户是否已登录
  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn')
    if (loginStatus === 'true') {
      setIsLoggedIn(true)
      // 直接设置为 false，不显示 Welcome 组件
      setShowWelcome(false)
    }
  }, [])

  // 处理登录 - 登录成功时设置状态
  const handleLogin = () => {
    setIsLoggedIn(true)
    // 不显示 Welcome
    setShowWelcome(false)
    localStorage.setItem('isLoggedIn', 'true')
  }

  // 处理从 Welcome 开始聊天的回调
  const handleWelcomeStartChat = (inputs: Record<string, any>) => {
    console.log('Start chat with inputs:', inputs)
    // 这里可以处理开始聊天的逻辑
    setShowWelcome(false) // 隐藏 Welcome 组件，显示聊天界面
    // 可能需要进行其他初始化操作
  }

  // 处理输入变化
  const handleInputsChange = (inputs: Record<string, any>) => {
    console.log('Inputs changed:', inputs)
    // 保存用户输入
  }

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  // 如果登录了且需要显示 Welcome
  if (showWelcome && APP_INFO && promptConfig) {
    return (
      <Welcome
        conversationName="新对话"
        hasSetInputs={false}
        isPublicVersion={true}
        siteInfo={APP_INFO}
        promptConfig={promptConfig}
        onStartChat={handleWelcomeStartChat}
        canEditInputs={true}
        savedInputs={{}}
        onInputsChange={handleInputsChange}
      />
    )
  }

  // 如果不需要显示 Welcome，则显示正常的聊天界面
  if (appUnavailable)
    return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} />

  if (!APP_ID || !APP_INFO || !promptConfig)
    return <Loading type='app' />

  return (
    <div className='bg-gray-100'>
      <Header
        title={APP_INFO.title}
        isMobile={isMobile}
        onShowSideBar={showSidebar}
        onCreateNewChat={() => handleConversationIdChange('-1')}
      />
      <div className="flex rounded-t-2xl bg-white overflow-hidden">
        {/* sidebar */}
        {!isMobile && renderSidebar()}
        {isMobile && isShowSidebar && (
          <div className='fixed inset-0 z-50'
            style={{ backgroundColor: 'rgba(35, 56, 118, 0.2)' }}
            onClick={hideSidebar}
          >
            <div className='inline-block' onClick={e => e.stopPropagation()}>
              {renderSidebar()}
            </div>
          </div>
        )}
        {/* main */}
        <div className='flex-grow flex flex-col h-[calc(100vh_-_3rem)] overflow-y-auto'>
          <ConfigSence
            conversationName={conversationName}
            hasSetInputs={hasSetInputs}
            isPublicVersion={isShowPrompt}
            siteInfo={APP_INFO}
            promptConfig={promptConfig}
            onStartChat={handleStartChat}
            canEditInputs={canEditInputs}
            savedInputs={currInputs as Record<string, any>}
            onInputsChange={setCurrInputs}
          ></ConfigSence>

          {
            hasSetInputs && (
              <div className='relative grow h-[200px] pc:w-[794px] max-w-full mobile:w-full pb-[66px] mx-auto mb-3.5 overflow-hidden'>
                <div className='h-full overflow-y-auto' ref={chatListDomRef}>
                  <Chat
                    chatList={chatList}
                    onSend={handleSend}
                    onFeedback={handleFeedback}
                    isResponding={isResponding}
                    checkCanSend={checkCanSend}
                    visionConfig={visionConfig}
                  />
                </div>
              </div>)
          }
        </div>
      </div>
    </div>
  )
}

export default React.memo(Main)
