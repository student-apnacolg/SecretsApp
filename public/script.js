function togglePassword() {
  const passInput = document.getElementById('password')
  const toggleIcon = document.getElementById('toggleIcon')

  const isPassword = passInput.type === "password";
  passInput.type = isPassword? "text" : "password";

  toggleIcon.classList.toggle("fa-eye")
  toggleIcon.classList.toggle("fa-eye-slash")
}