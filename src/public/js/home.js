axios.defaults.withCredentials = true;
axios.defaults.headers["Content-Type"] = "application/json";
const socket = io();

window.addEventListener("pageshow", (event) => {
    if (performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
        location.reload();
    }
});

const userNameForm = document.querySelector('#userInfo form');
let isSavedName = false;

const emptyInput = (isEmpty = true) => {
    const alertSpan = document.getElementById('alert');
    const input = userNameForm.querySelector('input');
    if(isEmpty) {
        alertSpan.classList.remove('hidden');
        input.classList.add('error');
    } else {
        alertSpan.classList.add('hidden');
        input.classList.remove('error');
    }
}

const getUserName = () => {
    axios.get('/get-name').then((res) => {
        isSavedName = !!res.data.userName;
    })
}
userNameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = userNameForm.querySelector('input');
    if(input.value === '') {
        emptyInput();
        return;
    }

    axios.post('/register-name', { userName: input.value }).then((res) => {
        emptyInput(false);
        isSavedName = true;
    })
})

document.querySelectorAll('#menu > .item').forEach((menu) => {
    menu.addEventListener('click', async (event) => {
        await getUserName();

        if(isSavedName) {
            location.href = `/${event.currentTarget.dataset.menu}`;
        } else {
            userNameForm.querySelector('input').focus();
            emptyInput(true);
        }
    })
})


