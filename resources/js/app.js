/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */


require('./bootstrap');

window.Vue = require('vue');
import Vue from 'vue'

import VueChatScroll from 'vue-chat-scroll'

Vue.use(VueChatScroll)

import Toaster from 'v-toaster'

// You need a specific loader for CSS files like https://github.com/webpack/css-loader
import 'v-toaster/dist/v-toaster.css'

// optional set default imeout, the default is 10000 (10 seconds).
Vue.use(Toaster, {timeout: 3000})

Vue.component('chat-box', require('./components/ChatBox.vue').default);


const app = new Vue({
    el: '#app',
    data: {
        message: '',
        chat: {
            messages: [],
            user: [],
            color: [],
            time: [],
        },
        typing: '',
        numberOfUsers: 0
    },
    methods: {
        send() {
            if (this.message.length > 0) {
                // console.log(this.message)
                this.chat.messages.push(this.message);
                this.chat.user.push('you');
                this.chat.color.push('success');
                this.chat.time.push(this.getTime());
                axios.post('/send', {
                    message: this.message,
                    chat:this.chat
                })
                    .then(response => {
                        this.message = '';
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }

        },
        getTime() {
            let time = new Date();
            return time.getHours() + ':' + time.getMinutes();
        },


        getOldMessages(){
            axios.post('/getOldMessage')
                .then(response => {
                    console.log(response);
                    if (response.data != '') {
                        this.chat = response.data;
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        },

        deleteSession() {
            axios.post('/deleteSession')
                .then(response => this.$toaster.success('Chat history is deleted'));
        }
    },
    watch: {
        message() {
            Echo.private('chat')
                .whisper('typing', {
                    message: this.message,
                    chat: this.chat
                });
        }
    },
    mounted() {
        this.getOldMessages();
        Echo.private('chat')
            .listen('ChatEvent', (e) => {
                this.chat.messages.push(e.message);
                this.chat.user.push(e.user);
                this.chat.color.push('warning');
                this.chat.time.push(this.getTime());
                axios.post('/saveToSession', {
                    chat: this.chat
                })
                    .then(response => {
                    })
                    .catch(error => {
                        console.log(error);
                    });

            })
            .listenForWhisper('typing', (e) => {
                if (e.name != '') {
                    this.typing = 'typing...'
                } else {
                    this.typing = ''
                }

            });

        Echo.join(`chat`)
            .here((users) => {
                this.numberOfUsers = users.length;
            })
            .joining((user) => {
                this.numberOfUsers += 1;
                // console.log(user);
                this.$toaster.success(user.name + ' is joined the chat room');
            })
            .leaving((user) => {
                this.numberOfUsers -= 1;
                this.$toaster.warning(user.name + ' is leaved the chat room');
            });
    }
});
