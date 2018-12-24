

/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */ 
 
let Humanizer;
Ractive.components.DropdownContent = Ractive.extend({
    css:`
        .dropdown-background{
            position:fixed;
            top:0;left:0; width:100%;height:100%;
            background-color:rgba(0,0,0,0.15);
            -moz-box-sizing: border-box; box-sizing: border-box;
            z-index: 10;
        }
        .dropdown-content {
            position: absolute;
            background-color: #f9f9f9;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            padding: 1em;
            z-index: 1;
            border-radius:3px;
            margin-right:1em;
            z-index:11;
        }
    `,
    oninit() {
        return this.on('closeme',function() { return this.set('show',false); });
    },
    data() {
        return {show:false};
    },
    template:`
        {{#if show}}
            <div class="dropdown-content" slide-in slide-out on-blur='blur'>
                {{yield}}
            </div>
            <div class="dropdown-background" on-click="closeme" fade-in fade-out></div>
        {{/if}}
        `
});
    
    
 
/*
    'ekp' = Expression Key Path
*/

Ractive.components.FunctionSwitcher = Ractive.extend({
    css:`
        .dropdown-content .btn{
            margin:2px;
        }
    `,
    data() {
        return {show_dropdown:false};
    },
    oninit() {
        return this.on('set-expression-element',function() { return this.set('show_dropdown',false); });
    },            
    template:`
        <div class="dropdown">
            <button class="btn btn-secondary btn-sm" on-click="@.toggle('show_dropdown')">
                {{function.description}} 
            </button>
            <DropdownContent show={{show_dropdown}} >
                {{#each functionsByType(function.arity,function.returnType) as f}}
                    <button 
                        class="btn  btn-sm {{function.name==f.name?'btn-primary':'btn-secondary'}}" 
                        on-click="['set-expression-element',ekp, f.name]"
                        >
                        {{f.description}}
                    </button>
                {{/each}}
            </DropdownContent>
        </div>
    `
    });

            
Ractive.components.Atomic = Ractive.extend({
    /*
        This really needs to be able to distinguish between types:
        number, text, boolean
    */
    template:`
        {{#if 'boolean'==typeof element}}
            <button class="btn {{element?'btn-primary':'btn-secondary'}} btn-sm" on-click="['set-expression-element',ekp,!element]">
                {{element?'Yes':'No'}}
            </button>
            
        {{else}}
            <input class="form-control input-sm" type="text" value="{{element}}" on-keyup="['set-expression-element',ekp,element]"> 
        {{/if}}
    `
});


/*
    Eventually need to be able to handle table/column_name/json key trees!
*/
Ractive.components.ColumnSelector = Ractive.extend({
    css:`
        .name-selector{
            margin-top:4px;
        }
        .name-selector .btn{
            margin:2px;
        }
        .name-selector input{
            margin-bottom:1em;
        }
        .label{
                cursor:pointer;

        }
    `,
    
    data() {
        return {show_dropdown:false};
    },
    oninit() {
        return this.on('set-expression-element',function() {
            return this.set('show_dropdown',false);
        });
    },
        
    template:`
        
        <button class="btn btn-primary btn-sm" on-click="@.toggle('show_dropdown')">
            {{column}}
        </button>
        
        <DropdownContent show={{show_dropdown}} >
            <div class="name-selector">
                
                {{#each column_names as k}}
                
                        <button class="btn btn-sm {{(k==name)?'btn-primary':'btn-info'}}  " on-click="['set-expression-element',ekp, k]">{{k}}</button>
                
                {{/each}}
            </div>
        </DropdownContent>
                
`
});
            
    


Ractive.components.UnitaryExpression = Ractive.extend({
    css:`

        .float-left{
            float:left;
            margin-right: 1rem;
        }
        `,
    template:`

        
        {{#if atomic(argument) || unitary(argument)}}  
            <div class="float-left">
                <ExpressionElement expression={{argument}} ekp="{{ekp}}.1"/>
            </div>
            <div class="float-left">
                <FunctionSwitcher function={{function}}  ekp="{{ekp}}.0" />
            </div>
        {{else}}
            <FunctionSwitcher function={{function}}  ekp="{{ekp}}.0" />
            <RecursiveExpressionElement operator={{head(argument)}} operands = {{tail(argument)}} ekp="{{ekp}}.1"/> 
        {{/if}}
        
    `
});
    
        
Ractive.components.BinaryExpression = Ractive.extend({
    css:`
        .float-left{
            float:left;
            margin-right: 1rem;
        }
    `,
    template:`
    
        {{#if (unitary(left) || atomic(left)) && (unitary(right)||atomic(right))}}
            <div class="binary-wrapper">
            
                <div class="float-left"><ExpressionElement expression={{left}} ekp="{{ekp}}.1" /></div>
                <div class="float-left"><FunctionSwitcher function={{function}}  ekp="{{ekp}}.0" /></div>
                <div class="float-left"><ExpressionElement expression={{right}} ekp="{{ekp}}.2" /></div>
                <div style="clear:both"></div>
            </div>
        {{else}}
        
            <ExpressionElement expression={{left}} ekp="{{ekp}}.1" />
            <FunctionSwitcher function={{function}}  ekp="{{ekp}}.0" />
            <ExpressionElement expression={{right}} ekp="{{ekp}}.2" />
        {{/if}}
    `
});
    
        
Ractive.components.ExpressionElement = Ractive.extend({
    template:`\
            
            
        <div class="expression-element" fade-in fade-out>
            {{#if atomic(expression)}}    
                <Atomic element={{expression}} ekp="{{ekp}}"/>
            {{else}}
                <RecursiveExpressionElement operator={{head(expression)}} operands = {{tail(expression)}} ekp="{{ekp}}"/>
            {{/if}}
        </div>\
    `
});
    
Ractive.components.VariadicExpression = Ractive.extend({ 
    css:`
        /*
            border must be dependent on function
        */
        .green-border{
            border-left:5px solid #bdb;
        }
        .blue-border{
            border-left:5px solid #bbd;
        }
        .variadic-expression{
            
            padding-left:1em;
            margin:1em;
        }


        .variadic-element{
            display:grid;
            grid-template-columns: 75% 25%;
            border-radius:3px;
            border: solid 1px #ddd;
            margin:0.5em;
            padding:3px;
        }

        .ordering-buttons button{
            float:right;
            opacity:0.35;
            margin-right:1px;
            
        }
        .new-element-row{
            margin:0.5em;
            padding:3px;
        }
        .grey-buttons button{
            background-color:gray;
            color:white
        }
        .ordering-buttons button:hover {
            opacity:1;
        }
    `,
    data() {
        return {
            get_border_class(operator){
                if ('all'===operator) { return 'green-border'; }
                if ('any'===operator) { return 'blue-border'; }
            }
        };
    },
    template:`

        <div class="variadic-expression  {{get_border_class(operator)}}">
            <FunctionSwitcher  function={{functionSignatures[operator]}}  ekp="{{ekp}}.0"/>
            {{#each operands as element:i}}
                <div class="variadic-element">
                    <div>
                        <ExpressionElement expression = {{element}} ekp="{{ekp}}.{{1+i}}" />
                    </div>
                    <div class="ordering-buttons grey-buttons">
                    
                        <button class="btn btn-secondary btn-sm" on-click="['delete-element',ekp,1+i]">
                            <span class="oi oi-x"></span>
                        </button>
                        
                    </div>    
                </div>
            {{/each}}
            <div class="new-element-row grey-buttons">
                
                    <NewElement ekp={{ekp}}.{{1+operands.length}} />
                    
                
            </div>
        </div>
`
});
    
Ractive.components.NewElement = Ractive.extend({
    css:`
        .dropdown-content .btn{
            margin:2px;
        }
    `,
    oninit() {
        return this.on('set-expression-element',function() { return this.set('show_dropdown',false); });
    },
    template:`

        <button class="btn btn-secondary  btn-sm" on-click="['set-expression-element',ekp,['=',['val','fish',column_names[0]],""]]" >
            <span class="oi oi-plus"></span>
        </button>
        
    `
});
Ractive.components.RecursiveExpressionElement = Ractive.extend({
    
    /*
    operator=head(expression)
    operands=tail(expression)
    */

    template:`
        {{#if operator=='let'}}
            pretty sure we don't need this.
            
        {{else}}
            {{#with functionSignatures[operator] as function}}
                {{#if 'val'==function.name}}
                    <ColumnSelector table={{operands[0]}} column={{operands[1]}} ekp="{{ekp}}.2"/>
                {{elseif function.arity==1}}
                    <UnitaryExpression function={{function}} argument={{operands[0]}} ekp="{{ekp}}" />
                {{elseif function.arity==2}}
                    <BinaryExpression function={{function}} operator={{operator}} left={{operands[0]}} right={{operands[1]}}  ekp="{{ekp}}"/>
                {{else}}
                    <VariadicExpression operator={{operator}} operands={{operands}} ekp="{{ekp}}" />
                {{/if}}
            {{/with}}
        {{/if}}
    `
});
        
Ractive.components.Humanizer = (Humanizer = Ractive.extend({
    css:`
        .line{
            margin-top:1em;
        }
    `,
    template:`

        <ExpressionElement expression = {{expression}} ekp="expression" />

        
        
    `,
    oninit() {
        this.on('set_sample',function(context, i){
            return this.set('expression',this.get('samples')[i]);
    });
            
        this.on('*.set-expression-element',function(context, ekp, element){
            //console.log(element);
            return this.set(ekp, element);
        });
            
        this.on('*.delete-element',function(context,ekp,index){
            /*
                I think this is actually flawed.
                
                Maybe a result of decaffeinate?
                
                @set ekp,(el for el,i in current when i!=index)
                
            */
            const current = this.get(ekp);
            if (!_.isArray(current)) { return; }
            //doesn't seem to quite work right?
            this.set(ekp,current.filter((el,ix)=>{return ix!=index}))
            
        });
            
        return this.on('*.swap-element',function(context,ekp,i1,i2){
            console.log('swap');
            const l = this.get(ekp);
            if (!_.isArray(l)) { return; }
            console.log(i1,i2);
            const a=l[i1];
            const b=l[i2];
            l[i1]=b;
            l[i2]=a;
            return this.animate(ekp, l);
        });
    }
}));
/*
    The 'val' function needs a list of available context keys for, say, a dropdown, yesno?
    
    humanizer needs to cope with atomic values being expressions.
    
    I think this function is used on the expression sandbox only
    
*/