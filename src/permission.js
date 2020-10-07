import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
// auth文件主要依赖js-cookie模块，把getToken，setToken，removeToken设置在这里
import { getToken } from '@/utils/auth'

// get-page-title文件主要是网站的标题，get-page-title通过依赖setting.js里的title变量修改网站标题
// 如果需要更改网站的标题，可以直接到setting.js修改title属性
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

// 路由白名单列表，把路由添加到这个数组，不用登陆也可以访问
const whiteList = ['/login']

router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // 如果用户存在令牌的情况请求登录页面，就让用户直接跳转到首页，避免存在重复登录的情况
      next({ path: '/' })
      NProgress.done() // hack: https://github.com/PanJiaChen/vue-element-admin/pull/2939
    } else {
      // 如果已经有令牌的用户请求的不是登录页，是其他页面
      // 就从Vuex里拿到用户的信息，这里也证明用户不是第一次登录了
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        next()
      } else {
        try {
          // get user info
          // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
          const { roles } = await store.dispatch('user/getInfo')

          // generate accessible routes map based on roles
          const accessRoutes = await store.dispatch('permission/generateRoutes', roles)

          // dynamically add accessible routes
          router.addRoutes(accessRoutes)

          // hack method to ensure that addRoutes is complete
          // set the replace: true, so the navigation will not leave a history record
          next({ ...to, replace: true })
        } catch (error) {
          // 如果出错了，把令牌去掉，并让用户重新去到登录页面
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    // 这里是没有令牌的情况
    // 还记得上面的白名单吗，现在起作用了
    if (whiteList.indexOf(to.path) !== -1) { // 判断用户请求的路由是否在白名单里
      // 不是-1就证明存在白名单里，不管你有没有令牌，都直接去到白名单路由对应的页面
      next()
    } else {
      // 如果这个页面不在白名单里，直接跳转到登录页面
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // 每次请求结束后都需要关闭进度条
  NProgress.done()
})
