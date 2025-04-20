## workflow中只展示关键节点更改进程
1. workflow-process.tsx里面定位NodePannel 定位方法介绍：给一个输入展示工作流的prompt，之后就会有工作流节点的展示，f12得到前端渲染格式，再vscode ctrl+F 定位到这里 
2. NodePannel跳转到node.tsx里面，发现NodePannel是拿props函数接受的，然后去看结构体，发现我们可以找到结构体格式，其中再点NodeTracing，其中发现模型的输出里面有个node_type，把node_type只保留llm，也就是非llm节点的输出我们直接设置成节点返回为空
3. 综上只对，node.tsx里面的hide_info props接受时候，设置成llm是false，其余全部设置成true，并且对不想展示的节点直接返回空，你看源代码部分那个return，只是对hideinfo为true的部分做了平角圆角的修改，所以在前面直接把空结点返回
  
## 问题部分：
1. workflow我感觉整体框架里面 能改的部分都改好了，但是运行还是在显示不重要的节点流
2. file文件上传部分，我去找了issue里面的问题解释，说目前是dify那边更新了什么东西，导致那个之前的webui应用界面没法对接了，https://github.com/langgenius/webapp-conversation/issues/112 140 都是issue关于这个的讨论，目前没人解决这个问题
这个人提出他的这个观点：https://juejin.cn/post/7475911632335323176 但我试了一下npmrun 是在报错本地改了配置 我后面下来想想怎么搞 4.20晚有个排练，得占一下时间



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
