二次开发项目修改的问题：
1. 文件上传修改的enable问题；组件上传属性值修改
2. 节点hideinfo属性也会被父组件props类似的赋值，最后直接通过筛选node_type返回空结点，实现只对核心节点llm的展示




源项目的fork部署部分如下，相同部署：
## Conversation Web App Template
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Config App
Create a file named `.env.local` in the current directory and copy the contents from `.env.example`. Setting the following content:
```
# APP ID: This is the unique identifier for your app. You can find it in the app's detail page URL. 
# For example, in the URL `https://cloud.dify.ai/app/xxx/workflow`, the value `xxx` is your APP ID.
NEXT_PUBLIC_APP_ID=

# APP API Key: This is the key used to authenticate your app's API requests. 
# You can generate it on the app's "API Access" page by clicking the "API Key" button in the top-right corner.
NEXT_PUBLIC_APP_KEY=

# APP URL: This is the API's base URL. If you're using the Dify cloud service, set it to: https://api.dify.ai/v1.
NEXT_PUBLIC_API_URL=
```

Config more in `config/index.ts` file:   
```js
export const APP_INFO: AppInfo = {
  title: 'Chat APP',
  description: '',
  copyright: '',
  privacy_policy: '',
  default_language: 'zh-Hans'
}

export const isShowPrompt = true
export const promptTemplate = ''
```

### Getting Started
First, install dependencies:
```bash
npm install
# or
yarn
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Using Docker

```
docker build . -t <DOCKER_HUB_REPO>/webapp-conversation:latest
# now you can access it in port 3000
docker run -p 3000:3000 <DOCKER_HUB_REPO>/webapp-conversation:latest
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
