let webSocket=require('ws')

var wsPing=new webSocket.Server({port:8080})
wsPing.on('connection',(socket)=>{
socket.on('message',(message)=>{
console.log('received:',message.toString("utf8"))

})

})
