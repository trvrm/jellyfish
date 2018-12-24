/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _functionSignatures=[
    {name:"<",          arity:2            , returnType: "boolean", description:"<"                             },
    {name:">",          arity:2            , returnType: "boolean", description:">"                                },
    {name:"<=",         arity:2            , returnType: "boolean", description:"<="                           },
    {name:">=",         arity:2            , returnType: "boolean", description:">="                               },
    {name:"=",          arity:2            , returnType: "boolean", description:"equals"                          },
    {name:"!=",         arity:2            , returnType: "boolean", description:"does not equal"               },
    {name:"all",        arity:"variadic"   , returnType: "boolean", description:"all of the following are true:"   },
    {name:"any",        arity:"variadic"   , returnType: "boolean", description:"any of the following are true:"   },
    
    
    //This arity isn't true any more. We might want to choose a different name for this function
    {name:"val",        arity:1            , returnType: "string",  description:"the value of"                    },  
    {name:"is_null",        arity:1            , returnType: "string",  description:"is null"                    },  
    {name:"not",        arity:1            , returnType: "boolean", description:"is not true"                  },
    
    // etc.
     
];    
 
const functionSignatures={};
for (var s of Array.from(_functionSignatures)) {   
    functionSignatures[s.name]=s;
}
    
    
const functionsByType = (arity,returnType) => (() => {
    const result = [];
    for (let name in functionSignatures) {
        s = functionSignatures[name];
        if ((s.arity === arity) && (s.returnType === returnType)) {
            result.push(s);
        }
    } 
    return result;
})() ;
    

const atomic = function(expression)  { 
    if (("number" === typeof expression) || ("boolean" === typeof expression) || ("string" === typeof expression)) { return true; }
    if (_.isArray(expression)) { return false; }
    throw `bad expression in atomic() :${expression}`;
};


const unitary = function(expression){
    // return true if this is a unitary function
    /*
        I suppose technically i should look this up in the function table?
    */
    if (!_.isArray(expression)) { return false; }
    const f = functionSignatures[expression[0]];
    if (f.arity!=1){return false;}
    //if (expression.length!==2) { return false; }
    if (!atomic(expression[1])) { return false; }
    return true;
};


const mythrow = function(what){
    //console.trace()
    throw what;
};
const head = function(l) {
    if (!_.isArray(l)) { throw `not an array: ${l}`; }
    if (l.length) { return l[0]; }
    throw ("Empty list in head()");
};
const tail = function(l) {
    if (!_.isArray(l)) { throw "not an array"; }
    if (l.length) { return l.slice(1); }
    throw ("Empty list in tail()");
};

const INFIX_OPERATORS={
    // "/":"divided by",
    // "+":"plus",
    // "-":"minus",
    // "*":"times",
    ">":"is greater than",
    ">=":"is greater than or equal to",
    "<":"is less than",
    "<=":"is less than or equal to",
    "=":"is equal to",
    // "contains":"is in"
};

const POSTFIX_OPERATORS={
    "is_number":"is a number",
    "empty":"is empty",
    "is_integer":"is an integer",
    
};
const PREFIX_OPERATORS={
    "not":"the following is not true:",
    // "year":"extract the year from",
    // "month":"extract the month from",
    // "day":"extract the day from",
    // "hour":"extract the hour from",
    // "minute":"extract the minutes from",
    // "second":"extract the seconds from",
    // "upper":"the uppercase of",
    // "lower":"the lowercase of",
    // "length":"the length of"
};

const VARIADIC_FUNCTIONS={
    "all":"all the following are true",
    "any":"any of the following are true",
    // "min":"the minimum of",
    // "max":"the maximum of",
    // "sum":"the sum of",
    // "count":"the count of"
};


const joinit_ = function*(l,delimiter) {
    if (l.length) { 
        yield l[0];
        return yield* (function*() {
            const result = [];
            for (let element of Array.from(l.slice(1))) {
                yield delimiter;
                result.push(yield element);
            }
            return result;
        }).call(this);
    }
};

const joinit = (l,delimiter) => Array.from(joinit_(l,delimiter));
    
    
const humanize_id_expr=function(id_expr){
    const name        = id_expr[0];
    const expression  = id_expr[1];
    return [`${name} =` ].concat(humanizeTree(expression));
};
    
const humanizeLet =function(t){
    /*
        Have to be careful because `concat` doesn't follow the same semantics as python `extend` or `+`
    */
    let element;
    let idexprs = t[0];
    let expression = t[1];
    idexprs = joinit((Array.from(idexprs).map((id_expr) => humanize_id_expr(id_expr))),'and');
    return ["let"].concat(idexprs).concat("in").concat(humanizeTree(expression));
    expression = t[1];
    //not quite working yet
    for (let idexpr of Array.from(t[0])) { idexprs= [`${idexpr[0]} =`].concat([((() => {
        const result = [];
        for (element of Array.from(t[0][1])) {             result.push(humanizeTree(element));
        }
        return result;
    })())]); }
    
    
    return ["let"].concat(idexprs).concat(["in"]).concat([((() => {
        const result1 = [];
        for (element of Array.from(t[1])) {             result1.push(humanizeTree(element));
        }
        return result1;
    })())]);
};
    
    
const humanizers= {
    val(t) { return `{{${t[0]}}}`; },
    all(t) { return ["all of the following are true:"].concat(joinit((Array.from(t).map((element) => humanizeTree(element))),'and')); },
    any(t) { return ["any of the following are true:"].concat(joinit((Array.from(t).map((element) => humanizeTree(element))),'or')); },
    if(t) { return ["if",humanizeTree(t[0]),"then",humanizeTree(t[1]),"else",humanizeTree(t[2])]; },
    let: humanizeLet
};

const postfix     = (h,t) => [humanizeTree(t[0]),POSTFIX_OPERATORS[h]];
const prefix      = (h,t) => [PREFIX_OPERATORS[h],humanizeTree(t[0])]; 
const infix       = (h,t) => [humanizeTree(t[0]),INFIX_OPERATORS[h],humanizeTree(t[1])];
const variadic    = (h,t) => [VARIADIC_FUNCTIONS[h]] + (Array.from(t).map((element) => humanizeTree(element)));

var humanizeTree = function(tree) {
    if (atomic(tree)) { return `${tree}`; }
    
    const h=head(tree);
    const t=tail(tree);
    
    if (h in humanizers) { return humanizers[h](t); }
    if (h in POSTFIX_OPERATORS) { return postfix(h,t); } 
    if (h in PREFIX_OPERATORS) { return prefix(h,t); }
    if (h in INFIX_OPERATORS) { return infix(h,t); }
    if (h in VARIADIC_FUNCTIONS) { return variadic(h,t); }

    return console.warn("unreachable code reached");
};


var flatten_= function*(tree,depth){ 
    if (depth == null) { depth = 0; }
    if (atomic(tree)) {
        return yield [depth,tree];
    } else {
        return yield* (function*() {
            const result = [];
            for (let element of Array.from(tree)) {
                result.push(yield* flatten_(element,1+depth));
            }
            return result;
        }).call(this);
    }
};


const flatten = tree=> Array.from(flatten_(tree));
const humanize = expression=> flatten(humanizeTree(expression));
    

_.extend(Ractive.defaults.data, {
        head,
        tail,
        atomic,
        unitary,
        functionSignatures,
        functionsByType
    }
);

Ractive.defaults.data.check = function(expression,comment) { 
    if (!_.isArray(expression)) { throw comment; }
};

Ractive.components.ExpressionRow = Ractive.extend({
    template:`\

<div class="line" style="padding-left:{{depth}}em">{{text}}</div>\
`
});
    
Ractive.components.Humanized = Ractive.extend({ 
    css:`\
.humanized:{
    font-family:'Ubuntu Mono',Consolas,Inconsolata,Menlo,Monaco,'Liberation Mono','Courier 10 Pitch','Courier New',monospace;
    color:#999
}\
`,
    template:`\

<div class='humanized'>
    {{#each @this.humanize(expression) as pair}}
        <ExpressionRow depth={{pair[0]}} text={{pair[1]}} />
    {{/each}}
</div>\
`,
    humanize
});