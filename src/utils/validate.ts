export function validatePassword(password: string) {
  return !!/^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(password);
}
export function validateUsername(username: string) {
  return !!/^[a-zA-Z0-9À-ž._\-\^\*가-힣]+$/.test(username);
}