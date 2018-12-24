const STATES=['CONNECTING','CONNECTED','CLOSING','CLOSED'];
const STATECLASSES=['badge-warning','badge-success','badge-warning','badge-danger'];


Ractive.components.NavBar = Ractive.extend({
    data(){
        return {
            states:STATES,
            stateclasses:STATECLASSES
        };
    },
    template:`
        <div class="navbar  fixed-top navbar-dark bg-primary" style="padding:0rem 1rem">
            <a href="/" class="navbar-brand">JellyFish</a>
            <span class="navbar-text">
                <span class="badge badge-pill  badge-secondary ">{{version}}</span>
                <span class="badge badge-pill {{stateclasses[readyState]}}">{{states[readyState]}}</span>
            </span>
        </div>
`
});


Ractive.components.InfoMessages = Ractive.extend({
    data(){
        return {messages:[]};
    },
        
    template:`
        {{#each messages as message:index}}
            <div class="alert alert-{{message.level}}">
                <button type="button" class="close" aria-label="Close" on-click='@this.splice('messages',index,1)'>
                    <span aria-hidden="true">&times;</span>
                </button>
                {{#if message.title}}
                <h5 class="alert-heading">{{message.title}}</h5>
                {{/if}}
                {{message.text}}
            </div>
         {{/each}}
`
});
// ghastly hack
Ractive.defaults.data.column_names = ['first','last','species','color','gender'];

const MainScreen = Ractive.extend({
    
    data(){
        return {
            messages:[],
            readyState:0,
            version:"0.0.2",
            expression:["all",["=",["val","fish","species"],"Goldfish"]],
            querying:false
        
        };
    },
        
    template:`
    
        <NavBar version={{version}} readyState={{readyState}}/>

        <div class="container-fluid">
            <InfoMessages messages={{messages}} />
                
            <div class="row">
                <div class="col-sm">
                    <Humanizer 
                        expression={{expression}} 
                        context={{context}}
                        show_samples=1
                        samples={{samples}}
                    />
                    <hr>
                    
                    <Humanized
                        expression={{expression}}
                    />
                </div>
                <div class="col-sm">
                    
                      
                    {{#if result}}
                        <div class="card">
                            <div class="card-header text-{{match?'success':'warning'}}">
                                Result
                            </div>
                            <div class="card-body  p-0">
                                <table class="table table-sm table-striped">
                                    <thead>
                                        <tr>
                                            
                                            {{#each result.columns as column}}
                                                <th scope="col">{{column}}</th>
                                            {{/each}}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {{#each result.rows as row:j}}
                                            <tr>
                                                
                                                {{#each row as cell}}
                                                    <td>{{cell}}</td>
                                                {{/each}}
                                            </tr>
                                        {{/each}}
                                    </tbody>
                                </table>
                            </div>
                            <div class="card-footer text-muted">
                            Showing {{result.rows.length}}  of {{result.total}} rows
                            </div>
                        </div>

                        
                    {{/if}}

                </div>
            </div>
         </div>
         <nav class="navbar fixed-bottom navbar-light bg-light" style="padding:0.5rem 1rem">
           {{#if result}}
                <code>{{JSON.stringify(result.expression)}}</code>  <code>query time: {{result.duration}} seconds</code>
           {{/if}}
         </nav>
     `,
    
    // I feel this function may need to be more global than this?
    send(name,data){ if (data == null) { data = {}; } return this.ws.send(JSON.stringify([name,data])); },
        
    oninit() {
        
        
        const protocol = (location.protocol==="http:") ? 'ws' : 'wss';
        const url      = `${protocol}://${location.host}/ws/app`;
        
        const ws       = new ReconnectingWebSocket(url, null, {debug: true, reconnectInterval: 3000});
        this.ws      = ws;
        
        const stateChange = () => {
            return this.set('readyState', ws.readyState);
        };
            
        // This can be improved with the more generic ractive_set/ractive_push approach 
        // I've explored elsewhere.
        const handlers= {
            'app.version':data=> { 
                this.set({version:data.version});
            },
            message:message=> {
                this.push('messages', message);
            },
            'query.result':result=>{
                this.set('result',result);
                this.set('querying',false);
                
                //re-submit if changed
            },
            'column_names':data=>{
                //this.set('column_names',data.names);
                //Ractive.defaults.data.column_names = data.names;
                //console.log(data.names);
            },
            pong:() => console.log('pong')
        };
                

        ws.onmessage = event=> {
            const pair = JSON.parse(event.data);
            
            const message= {
                name:pair[0],
                data:pair[1]
            };
            
            if (message.name in handlers) {
                return handlers[message.name](message.data);
            } else {
                return console.warn(message);
            }
        };
        
        ws.onopen = ()=> {
            stateChange();
            this.send('hello');
        };
            

        ws.onclose      = stateChange;
        ws.onerror      = stateChange;
        ws.onconnecting = stateChange;
            
        setInterval((()=> this.send('ping')), 30*1000);
        
        submitIfChanged = ()=>{
            if(this.get('querying')){return;}
            
            const l = this.get('expression');
            const r = this.get('result.expression');
            if (_.isEqual(l,r)) {return;}
            
            console.log('submit, changed',l,r);
            this.send('query.apply',l);
        
            
        };
        
        setInterval(submitIfChanged, 500);
        
        
        this.on('*.send',function(context, name,data){
            this.send(name,data);
        });
        
        this.observe('expression result.expression',function(){
            const l = this.get('expression');
            const r = this.get('result.expression');
            const match = _.isEqual(l,r);
            console.log(match);
            this.set('match',match)
            
        });
        
    }
});


window.launch_jellyfish = function(element){
    new MainScreen({el:element});
};
        