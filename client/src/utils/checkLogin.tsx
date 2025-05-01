export default function checkLogin() {
  // 检查是否有有效的token，而不是依赖userStatus状态
  return !!localStorage.getItem('hexoProToken')
}
