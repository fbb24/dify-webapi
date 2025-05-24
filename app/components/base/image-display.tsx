import { useState, FC, useEffect } from 'react'
import Loading02 from '@/app/components/base/icons/line/loading-02'

interface ImageDisplayProps {
    imageUrl: string  // 直接接收图片URL作为属性
    alt?: string
    className?: string
    onError?: () => void
    onLoad?: () => void
}

const ImageDisplay: FC<ImageDisplayProps> = ({
    imageUrl,
    alt = '图片',
    className = '',
    onError,
    onLoad
}) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    // 当URL变化时重置状态
    useEffect(() => {
        setIsLoading(true)
        setHasError(false)
    }, [imageUrl])

    const handleImageLoad = () => {
        setIsLoading(false)
        onLoad?.()
    }

    const handleImageError = () => {
        setIsLoading(false)
        setHasError(true)
        onError?.()
    }

    return (
        <div className="relative">
            {/* 图片加载状态 */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                    <Loading02 className="w-5 h-5 animate-spin text-primary-600" />
                </div>
            )}

            {/* 图片加载错误状态 */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                    <div className="text-red-500 text-xs text-center px-2">
                        图片加载失败
                    </div>
                </div>
            )}

            {/* 实际图片元素 */}
            <img
                src={imageUrl}
                alt={alt}
                className={`w-full rounded ${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                style={{ minHeight: '150px', objectFit: 'contain' }}
                onLoad={handleImageLoad}
                onError={handleImageError}
            />
        </div>
    )
}

export default ImageDisplay