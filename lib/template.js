/**
  * Simple Templater ustility.
  *
  *  Author: Pavle Jonoski
  */
x = {
   util:{
      trim: function(str){
           str = str.replace(/^\s+/, '');
           for (var i = str.length - 1; i >= 0; i--) {
               if (/\S/.test(str.charAt(i))) {
                   str = str.substring(0, i + 1);
                   break;
               }
           }
           return str;
       },
       replaceAll: function(str, m, repl){
         return str.replace(new RegExp(m, 'g'), repl);
       },
       startsWith: function(str, pref){
         
         return str.match('^' + x.util.regexSafe(pref));
       },
       regexSafe: function(str){
         str = str.replace(new RegExp('\\\\',"g"), '\\\\');
         str = str.replace(/\$/gi, '\\$');
         str = str.replace(/\./gi, '\\.');
         str = str.replace(/\[/gi, '\\[');
         str = str.replace(/\]/gi, '\\]');
         str = str.replace(/\^/gi, '\\^');
         str = str.replace(/\(/gi, '\\(');
         str = str.replace(/\)/gi, '\\)');
         str = str.replace(/\{/gi, '\\{');
         str = str.replace(/\}/gi, '\\}');
        
         return str;
      },
      Template: function(config){
        var reg = new RegExp(/[#|@][^#@]+[#|@]/g);
        this.debug = config.debug;
         var build = function(template){
            var lines = template.split('\n');
            var buffer = [];
            for(var i = 0; i < lines.length; i++){
               var line = lines[i];
               if(line == '' || x.util.trim(line) == ''){
                  continue;
               }
               if(i < lines.length - 1)line = line + '\\n';
               var ms = line.match(reg);
               if(ms && ms.length){
                  var start = 0;
                  var end = 0;
                  for(var j = 0; j < ms.length; j++){
                     var expression = ms[j];
                     end = line.indexOf(expression);
                     var toExpression = line.substring(start, end);
                     if(config.supressWhitespace){
                        toExpression = x.util.trim(toExpression);
                     }
                     if(toExpression)
                        buffer.push("_write('" + x.util.replaceAll(toExpression, "'","\\'") + "');");
                     if(x.util.startsWith(expression, '#')){
                          buffer.push(expression.substring(1, expression.length-1));
                     }else{
                          buffer.push('_write(' + expression.substring(1, expression.length-1) + ');');
                     }
                     start = end + expression.length;
                  }
                  buffer.push("_write('" + x.util.replaceAll(line.substring(start), "'","\\'") + "');");
               }else{
                  var m = x.util.replaceAll(line, "'","\\'");
                  //if(m == '' || m == '\n')
                  buffer.push("_write('" + x.util.replaceAll(line, "'","\\'") + "');");
               }
            }
            return buffer;  
         };
         
         this.compile = function(str){
            var buffer = build(str);
            this.template = buffer.join('\n');
            this.compiled = true;
            return this.template;
         };
         
         this.merge = function(context){
            if(!this.compiled){
               return '';
            }
            context = context || {};
            context.self = this;
            var result = [];
            
            var _context = {
               _write: function(str){
                  result.push(str);
               },
               self: this
            };
            
            var cntVars = [];
            
            for(var cVar in _context){
               cntVars.push('var ' + cVar + ' = this.' + cVar + ';');
            }
            
            for(var cVar in context){
               cntVars.push('var ' + cVar + ' = this.' + cVar + ';');
               _context[cVar] = context[cVar];
            }
            cntVars.push(this.template);
            
            var evExpression = new Function(cntVars.join('\n'));
            try{
               evExpression.call(_context);
            }catch(ex){
               if(this.debug){
                  result = result.concat([
                     'Error Occured: ',
                     ex.message
                  ]);
               }else{
                  throw ex;
               }
            }
            var s = result.join('');
            return s;
         };
         config = config ||{};
         if(config.template){
            this.compile(config.template);
         }
         
      }
   }
};
