const passInput = document.getElementById('password')

const lower = document.getElementById('lower')
const upper = document.getElementById('upper')
const number = document.getElementById('number')
const special = document.getElementById('special')
const length = document.getElementById('length')

passInput.addEventListener('input', () => {
  const value = passInput.value;

  updateCheck(lower, /[a-z]/.test(value))
  updateCheck(upper, /[A-Z]/.test(value))
  updateCheck(number, /\d/.test(value))
  updateCheck(special, /[\W_]/.test(value))
  updateCheck(length, value.length>= 6)
})

function updateCheck(el, condition) {
  const icon = el.querySelector("i")
  if (condition) {
    el.classList.remove("invalid")
    el.classList.add("valid")
    icon.className = "fa-solid fa-check"
  } else {
    el.classList.remove("valid")
    el.classList.add("invalid")
    icon.className = "fa-solid fa-xmark"
  }
}

function togglePassword() {
const passInput = document.getElementById('password')
const toggleIcon = document.getElementById('toggleIcon')
  const isPassword = passInput.type === "password";
  passInput.type = isPassword? "text" : "password";

  toggleIcon.classList.toggle("fa-eye")
  toggleIcon.classList.toggle("fa-eye-slash")
}