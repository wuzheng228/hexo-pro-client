export default function checkLogin() {
  console.log('checkLogin', localStorage.getItem('userStatus') === 'login')
  return localStorage.getItem('userStatus') === 'login' || localStorage.getItem('userStatus') === 'unsafe';
}
