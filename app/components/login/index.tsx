'use client'
import React, { FC, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import s from './style.module.css'

interface LoginProps {
    onLogin?: () => void
}

const Login: FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loginSuccess, setLoginSuccess] = useState(false)
    const router = useRouter()

    // 监听登录状态变化，成功后跳转
    useEffect(() => {
        if (loginSuccess) {
            if (onLogin) {
                onLogin()
            } else {
                router.push('/welcome')
            }
        }
    }, [loginSuccess, onLogin, router])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // 验证输入
        if (!email || !password) {
            setError('用户名和密码不能为空')
            return
        }

        // 这里可以添加实际的登录验证逻辑
        // 模拟登录过程
        // 假设登录成功，设置成功状态
        setLoginSuccess(true)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-md">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">欢迎登录</h2>
                    <p className="text-gray-600 mt-2">请输入您的账号信息</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                            电子邮箱
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="请输入邮箱地址"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                            密码
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                记住我
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#" className="text-indigo-600 hover:text-indigo-500">
                                忘记密码?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-150"
                    >
                        登录
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        还没有账号?
                        <a href="#" className="text-indigo-600 hover:text-indigo-500 ml-1">
                            立即注册
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login