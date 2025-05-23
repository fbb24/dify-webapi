'use client'
import type { FC } from 'react'
import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import TemplateVarPanel, { PanelTitle, VarOpBtnGroup } from '../value-panel'
import FileUploaderInAttachmentWrapper from '../base/file-uploader-in-attachment'
import s from './style.module.css'
import { AppInfoComp, ChatBtn, EditBtn, FootLogo, PromptTemplate } from './massive-component'
import type { AppInfo, PromptConfig } from '@/types/app'
import Toast from '@/app/components/base/toast'
import Select from '@/app/components/base/select'
import { DEFAULT_VALUE_MAX_LEN } from '@/config'
import { useRouter } from 'next/navigation'


// regex to match the {{}} and replace it with a span
const regex = /\{\{([^}]+)\}\}/g

export type IWelcomeProps = {
  conversationName: string
  hasSetInputs: boolean
  isPublicVersion: boolean
  siteInfo: AppInfo
  promptConfig: PromptConfig
  onStartChat: (inputs: Record<string, any>) => void
  canEditInputs: boolean
  savedInputs: Record<string, any>
  onInputsChange: (inputs: Record<string, any>) => void
}

// 导出自定义 Hook
export const useModelId = () => {
  const [modelId, setModelId] = useState(0); // 默认为ChatGPT (0)
  return { modelId, setModelId };
};

const Welcome: FC<IWelcomeProps> = ({
  conversationName,
  hasSetInputs,
  isPublicVersion,
  siteInfo,
  promptConfig,
  onStartChat,
  canEditInputs,
  savedInputs,
  onInputsChange,
}) => {
  const router = useRouter()
  console.log(promptConfig)
  const { t } = useTranslation()
  const hasVar = promptConfig.prompt_variables.length > 0
  const [isFold, setIsFold] = useState<boolean>(true)
  const [inputs, setInputs] = useState<Record<string, any>>((() => {
    if (hasSetInputs)
      return savedInputs

    const res: Record<string, any> = {}
    if (promptConfig) {
      promptConfig.prompt_variables.forEach((item) => {
        res[item.key] = ''
      })
    }
    return res
  })())
  useEffect(() => {
    if (!savedInputs) {
      const res: Record<string, any> = {}
      if (promptConfig) {
        promptConfig.prompt_variables.forEach((item) => {
          res[item.key] = ''
        })
      }
      setInputs(res)
    }
    else {
      setInputs(savedInputs)
    }
  }, [savedInputs])

  const highLightPromoptTemplate = (() => {
    if (!promptConfig)
      return ''
    const res = promptConfig.prompt_template.replace(regex, (match, p1) => {
      return `<span class='text-gray-800 font-bold'>${inputs?.[p1] ? inputs?.[p1] : match}</span>`
    })
    return res
  })()

  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const [selectedModel, setSelectedModel] = useState<'ChatGPT' | 'Claude 3.7 Sonnet'>('ChatGPT')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isAvatarDropdownOpen, setAvatarDropdownOpen] = useState(false); // 新增状态管理头像下拉菜单
  const dropdownRef = useRef<HTMLDivElement>(null) // 添加下拉菜单的ref
  const buttonRef = useRef<HTMLButtonElement>(null) // 添加按钮的ref
  const avatarDropdownRef = useRef<HTMLDivElement>(null); // 新增ref用于头像下拉菜单
  const avatarBtnRef = useRef<HTMLButtonElement>(null); // 新增ref用于头像按钮
  const { modelId, setModelId } = useModelId(); // 使用自定义 Hook

  // 添加点击外部关闭下拉菜单的逻辑
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }

      // 新增：点击外部关闭头像下拉菜单
      if (isAvatarDropdownOpen &&
        avatarDropdownRef.current &&
        !avatarDropdownRef.current.contains(event.target as Node) &&
        avatarBtnRef.current &&
        !avatarBtnRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }

    // 添加全局点击事件监听器
    document.addEventListener('mousedown', handleClickOutside)

    // 清理事件监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, isAvatarDropdownOpen]) // 依赖于isDropdownOpen和isAvatarDropdownOpen状态

  // 将useEffect移到组件顶层
  useEffect(() => {
    console.log("Dropdown state changed:", isDropdownOpen);
  }, [isDropdownOpen]);

  // 当模型选择改变时更新modelId
  useEffect(() => {
    setModelId(selectedModel === 'ChatGPT' ? 0 : 1);
  }, [selectedModel, setModelId]);

  const renderHeader = () => {
    return (
      <div className='absolute top-0 left-0 right-0 flex items-center justify-between border-b border-gray-100 mobile:h-12 tablet:h-16 px-8 bg-white'>
        {/* 左侧模型选择 - 保持原有代码 */}
        <div className='relative'>
          <button
            ref={buttonRef}
            className='flex items-center space-x-2 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md transition-colors duration-200'
            onClick={() => {
              console.log("Button clicked, toggling dropdown");
              setIsDropdownOpen(prev => !prev);
            }}
            id="model-selector"
            name="model-selector"
          >
            <span className="font-medium">{selectedModel}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 111.414 1.414l-4 4a1 1 01-1.414 0l-4-4a 1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* 原有的左侧下拉菜单 */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className='fixed top-[64px] left-8 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 w-64 z-[9999] overflow-hidden'
              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
            >
              {/* 原有的下拉菜单内容 */}
              <div className='py-1'>
                <div className='px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50'>
                  选择模型
                </div>
                {[
                  { id: 'ChatGPT', name: 'ChatGPT', description: '适用于日常任务和通用问答' },
                  { id: 'Claude 3.7 Sonnet', name: 'Claude 3.7 Sonnet', description: '强大的理解与创作能力' }
                ].map((model) => (
                  <div
                    key={model.id}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${selectedModel === model.id ? 'bg-gray-50' : ''}`}
                    onClick={() => {
                      setSelectedModel(model.id as 'ChatGPT' | 'Claude 3.7 Sonnet');
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className='font-medium text-gray-800'>{model.name}</div>
                        <div className='text-xs text-gray-500 mt-0.5'>{model.description}</div>
                      </div>
                      {selectedModel === model.id && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}

                {/* 添加分隔线和"导入新模型"选项 */}
                <div className="border-t border-gray-100 my-1"></div>
                <div
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                  onClick={() => {
                    setIsDropdownOpen(false);  // 关闭模型下拉菜单
                    setShowApiImportModal(true);  // 显示API导入模态窗口
                  }}
                >
                  <div className="flex items-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">导入新模型</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 新增: 右侧头像和下拉菜单 */}
        <div className='relative'>
          <button
            ref={avatarBtnRef} // 需要在组件顶部添加这个ref
            className='flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200'
            onClick={() => {
              console.log("Avatar clicked, toggling dropdown");
              setAvatarDropdownOpen(prev => !prev);
            }}
          >
            {/* 头像图标 */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {/* 头像下拉菜单 */}
          {isAvatarDropdownOpen && (
            <div
              ref={avatarDropdownRef}
              className='fixed top-[64px] right-8 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 w-64 z-[9999] overflow-hidden'
              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
            >
              <div className='py-1'>
                <div className='px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50'>
                  高级功能
                </div>
                <div
                  className='px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150'
                  onClick={() => {
                    // 显示API导入模态窗口而不是导航
                    setShowApiImportModal(true);
                    setAvatarDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className='font-medium text-gray-800'>自选模型API导入</div>
                      <div className='text-xs text-gray-500 mt-0.5'>导入您自己的API密钥和模型</div>
                    </div>
                  </div>
                </div>
                <div
                  className='px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150'
                  onClick={() => {
                    router.push('/privacy-analysis'); // 修改为使用 router.push
                    setAvatarDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <div className='font-medium text-gray-800'>隐私信息分析</div>
                      <div className='text-xs text-gray-500 mt-0.5'>分析和保护您的隐私数据</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderInputs = () => {
    return (
      <div className='space-y-3'>
        {promptConfig.prompt_variables.map(item => (
          <div className='tablet:flex items-start mobile:space-y-2 tablet:space-y-0 mobile:text-xs tablet:text-sm' key={item.key}>
            <label className={`flex-shrink-0 flex items-center tablet:leading-9 mobile:text-gray-700 tablet:text-gray-900 mobile:font-medium pc:font-normal ${s.formLabel}`}>{item.name}</label>
            {item.type === 'select'
              && (
                <Select
                  className='w-full'
                  defaultValue={inputs?.[item.key]}
                  onSelect={(i) => { setInputs({ ...inputs, [item.key]: i.value }) }}
                  items={(item.options || []).map(i => ({ name: i, value: i }))}
                  allowSearch={false}
                  bgClassName='bg-gray-50'
                />
              )}
            {item.type === 'string' && (
              <input
                placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
                className={'w-full flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50'}
                maxLength={item.max_length || DEFAULT_VALUE_MAX_LEN}
              />
            )}
            {item.type === 'paragraph' && (
              <textarea
                className="w-full h-[104px] flex-grow py-2 pl-3 pr-3 box-border rounded-lg bg-gray-50"
                placeholder={`${item.name}${!item.required ? `(${t('app.variableTable.optional')})` : ''}`}
                value={inputs?.[item.key] || ''}
                onChange={(e) => { setInputs({ ...inputs, [item.key]: e.target.value }) }}
              />
            )}
            {item.type === 'number' && (
              <input
                type="number"
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500 "
                placeholder={`${item.name}${!item.required ? `(${t('appDebug.variableTable.optional')})` : ''}`}
                value={inputs[item.key]}
                onChange={(e) => { onInputsChange({ ...inputs, [item.key]: e.target.value }) }}
              />
            )}

            {
              item.type === 'file' && (
                <FileUploaderInAttachmentWrapper
                  fileConfig={{
                    allowed_file_types: item.allowed_file_types,
                    allowed_file_extensions: item.allowed_file_extensions,
                    allowed_file_upload_methods: item.allowed_file_upload_methods!,
                    number_limits: 1,
                    fileUploadConfig: {} as any,
                  }}
                  onChange={(files) => {
                    setInputs({ ...inputs, [item.key]: files[0] })
                  }}
                  value={inputs?.[item.key] || []}
                />
              )
            }
            {
              item.type === 'file-list' && (
                <FileUploaderInAttachmentWrapper
                  fileConfig={{
                    allowed_file_types: item.allowed_file_types,
                    allowed_file_extensions: item.allowed_file_extensions,
                    allowed_file_upload_methods: item.allowed_file_upload_methods!,
                    number_limits: item.max_length,
                    fileUploadConfig: {} as any,
                  }}
                  onChange={(files) => {
                    setInputs({ ...inputs, [item.key]: files })
                  }}
                  value={inputs?.[item.key] || []}
                />
              )
            }
          </div>
        ))}
      </div>
    )
  }

  const canChat = () => {
    const inputLens = Object.values(inputs).length
    const promptVariablesLens = promptConfig.prompt_variables.length
    const emptyInput = inputLens < promptVariablesLens || Object.values(inputs).filter(v => v === '').length > 0
    if (emptyInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const handleChat = () => {
    if (!canChat())
      return

    onStartChat(inputs)
  }

  const renderNoVarPanel = () => {
    if (isPublicVersion) {
      return (
        <div>
          <AppInfoComp siteInfo={siteInfo} />
          <TemplateVarPanel
            isFold={false}
            header={
              <>
                <PanelTitle
                  title={t('app.chat.publicPromptConfigTitle')}
                  className='mb-1'
                />
                <PromptTemplate html={highLightPromoptTemplate} />
              </>
            }
          >
            <ChatBtn onClick={handleChat} />
          </TemplateVarPanel>
        </div>
      )
    }
    // private version
    return (
      <TemplateVarPanel
        isFold={false}
        header={
          <AppInfoComp siteInfo={siteInfo} />
        }
      >
        <ChatBtn onClick={handleChat} />
      </TemplateVarPanel>
    )
  }

  const renderVarPanel = () => {
    return (
      <TemplateVarPanel
        isFold={false}
        header={
          <AppInfoComp siteInfo={siteInfo} />
        }
      >
        {renderInputs()}
        <ChatBtn
          className='mt-3 mobile:ml-0 tablet:ml-[128px]'
          onClick={handleChat}
        />
      </TemplateVarPanel>
    )
  }

  const renderVarOpBtnGroup = () => {
    return (
      <VarOpBtnGroup
        onConfirm={() => {
          if (!canChat())
            return

          onInputsChange(inputs)
          setIsFold(true)
        }}
        onCancel={() => {
          setInputs(savedInputs)
          setIsFold(true)
        }}
      />
    )
  }

  const renderHasSetInputsPublic = () => {
    if (!canEditInputs) {
      return (
        <TemplateVarPanel
          isFold={false}
          header={
            <>
              <PanelTitle
                title={t('app.chat.publicPromptConfigTitle')}
                className='mb-1'
              />
              <PromptTemplate html={highLightPromoptTemplate} />
            </>
          }
        />
      )
    }

    return (
      <TemplateVarPanel
        isFold={isFold}
        header={
          <>
            <PanelTitle
              title={t('app.chat.publicPromptConfigTitle')}
              className='mb-1'
            />
            <PromptTemplate html={highLightPromoptTemplate} />
            {isFold && (
              <div className='flex items-center justify-between mt-3 border-t border-indigo-100 pt-4 text-xs text-indigo-600'>
                <span className='text-gray-700'>{t('app.chat.configStatusDes')}</span>
                <EditBtn onClick={() => setIsFold(false)} />
              </div>
            )}
          </>
        }
      >
        {renderInputs()}
        {renderVarOpBtnGroup()}
      </TemplateVarPanel>
    )
  }

  const renderHasSetInputsPrivate = () => {
    if (!canEditInputs || !hasVar)
      return null

    return (
      <TemplateVarPanel
        isFold={isFold}
        header={
          <div className='flex items-center justify-between text-indigo-600'>
            <PanelTitle
              title={!isFold ? t('app.chat.privatePromptConfigTitle') : t('app.chat.configStatusDes')}
            />
            {isFold && (
              <EditBtn onClick={() => setIsFold(false)} />
            )}
          </div>
        }
      >
        {renderInputs()}
        {renderVarOpBtnGroup()}
      </TemplateVarPanel>
    )

  }

  const renderHasSetInputs = () => {
    if ((!isPublicVersion && !canEditInputs) || !hasVar)
      return null

    return (
      <div
        className='pt-[88px] mb-5'
      >
        {isPublicVersion ? renderHasSetInputsPublic() : renderHasSetInputsPrivate()}
      </div>)
  }

  // 添加一个状态控制API导入模态窗口的显示
  const [showApiImportModal, setShowApiImportModal] = useState(false)

  // API导入模态窗口组件
  const ApiImportModal = ({ onClose }: { onClose: () => void }) => {
    const [modelName, setModelName] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [apiUrl, setApiUrl] = useState('')
    const [importStatus, setImportStatus] = useState('')

    const handleImport = (e: React.FormEvent) => {
      e.preventDefault()
      // 模拟导入成功
      setImportStatus('API导入成功！')
      console.log('导入的信息:', { modelName, apiKey, apiUrl })

      // 清空表单并在3秒后关闭窗口
      setTimeout(() => {
        setModelName('')
        setApiKey('')
        setApiUrl('')
        setImportStatus('')
        onClose()
      }, 3000)
    }

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">自选模型API导入</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            输入您的API信息以使用自定义模型
          </p>

          <form className="space-y-6" onSubmit={handleImport}>
            <div>
              <label htmlFor="model_name" className="block text-sm font-medium text-gray-700">
                模型名称
              </label>
              <div className="mt-1">
                <input
                  id="model_name"
                  name="model_name"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="例如: GPT-4, Claude 3, etc."
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="mt-1">
                <input
                  id="api_key"
                  name="api_key"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="sk-xxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="api_url" className="block text-sm font-medium text-gray-700">
                API URL
              </label>
              <div className="mt-1">
                <input
                  id="api_url"
                  name="api_url"
                  type="url"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="https://api.example.com/v1"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
              </div>
            </div>

            {importStatus && (
              <div className="p-3 bg-green-50 text-green-700 rounded-md">
                {importStatus}
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                导入
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className='relative mobile:min-h-[48px] tablet:min-h-[64px]'>
      {hasSetInputs && renderHeader()}
      <div className='mx-auto pc:w-[794px] max-w-full mobile:w-full px-3.5'>
        {/*  Has't set inputs  */}
        {
          !hasSetInputs && (
            <div className='mobile:pt-[72px] tablet:pt-[128px] pc:pt-[200px]'>
              {hasVar
                ? (
                  renderVarPanel()
                )
                : (
                  renderNoVarPanel()
                )}
            </div>
          )
        }

        {/* Has set inputs */}
        {hasSetInputs && renderHasSetInputs()}

        {/* foot */}
        {!hasSetInputs && (
          <div className='mt-4 flex justify-between items-center h-8 text-xs text-gray-400'>

            {siteInfo.privacy_policy
              ? <div>{t('app.chat.privacyPolicyLeft')}
                <a
                  className='text-gray-500'
                  href={siteInfo.privacy_policy}
                  target='_blank'>{t('app.chat.privacyPolicyMiddle')}</a>
                {t('app.chat.privacyPolicyRight')}
              </div>
              : <div>
              </div>}
            <a className='flex items-center pr-3 space-x-3' href="https://dify.ai/" target="_blank">
              <span className='uppercase'>{t('app.chat.powerBy')}</span>
              <FootLogo />
            </a>
          </div>
        )}
      </div>

      {/* API导入模态窗口 - 仅在需要时显示 */}
      {showApiImportModal && (
        <ApiImportModal
          onClose={() => setShowApiImportModal(false)}
        />
      )}
    </div >
  )
}

export default React.memo(Welcome)
