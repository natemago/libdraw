(function($){
    
    libdraw.util.ns('libdraw.examples.ui');
    
    libdraw.examples.ui.CodeEditor = function(config){
       this.runtime = config.runtime;
       this.el = $(config.element);
       
       this.setupText = $('.setup-editor', this.el)[0];
       this.execText = $('.exec-editor', this.el)[0];
       var self = this;
       $('.ui-icon-play', this.el).click(function(e){
          try{
            var setupCallback = new Function(self.setupText.value);
            var execCallback = new Function(self.execText.value);
            self.runtime.stop();
            if(self.prevSetupCallback){
               self.runtime.removeSetupHandler(self.prevSetupCallback);
            }
            if(self.prevExecCallback){
               self.runtime.removeExecHandler(self.prevExecCallback);
            }
            self.runtime.clearRTEvents();
            self.prevSetupCallback = self.runtime.setup(setupCallback);
            self.prevExecCallback = self.runtime.exec(execCallback);
            self.runtime.init();
            self.runtime.start();
            }catch(ex){
               throw ex;
            }
        });
       
      $('.ui-icon-pause', this.el).click(function(){
         if(self.runtime.paused()){
            self.runtime.resume();
         }else{
            self.runtime.pause();
         }
      });
      $('.ui-icon-stop', this.el).click(function(){
         self.runtime.stop();
      });
      $('.ui-icon-cancel', this.el).click(function(){
         self.setupText.value = "";
         self.execText.value = "";
      });
      
      $('.reload-code', this.el).click(function(){
         if(self.currentExampleSrc){
             $.get(self.currentExampleSrc, 
                  function(response){
        
                     var r = $(response);
                     var setupEl = undefined;
                     var execEl = undefined;
        
                     var setupCode = '// no setup code';
                     var execCode =  '// no exec code';
        
                     r.each(function(n, e){
                        if(e.id == 'setup-code'){
                           setupEl = e;
                        }else if(e.id == 'exec-code'){
                           execEl = e;
                        }
                     });
        
        
                     if(setupEl) setupCode = setupEl.value || setupEl.innerText || setupEl.innerHTML;
                     if(execEl) execCode = execEl.value || execEl.innerText || execEl.innerHTML;
        
                     self.setupText.value = setupCode;
                     self.execText.value = execCode;
                     
                  });
         }
      });
      $('.ui-icon-lightbulb', this.el).click(function(){
         $('.custom-output').toggle();
      });
      // loader-wrapper
      this.loaderWrapper = $('.loader-wrapper', this.el); 
         var examplesTemplate = [
            'Load Example: <select class="examples-dropdown">',
            '#for(var i = 0; i < groups.length; i++){#',
               '<optgroup label="@groups[i].label@">',
               '#for(var j = 0; j < groups[i].examples.length; j++){#',
                  '<option value="@groups[i].examples[j].src@">@groups[i].examples[j].title@</option>',
               '#}#',
               '</optgroup>',
            '#}#',
            '</select>'
         ].join('\n');

         var examplesTmpl = new x.util.Template({template: examplesTemplate, debug: true});
         this.loaderWrapper.html(examplesTmpl.merge({groups: config.groups || []}));
       
         $('select.examples-dropdown').live('change', function(){
            var exampleSrc = this.value;
            if(exampleSrc && exampleSrc != 'none'){

               $.get(exampleSrc, 
                  function(response){
		  
                     var r = $(response);
                     var setupEl = undefined;
                     var execEl = undefined;
		  
                     var setupCode = '// no setup code';
                     var execCode =  '// no exec code';
		  
                     r.each(function(n, e){
                        if(e.id == 'setup-code'){
                           setupEl = e;
                        }else if(e.id == 'exec-code'){
                           execEl = e;
                        }
                     });
		  
		  
                     if(setupEl) setupCode = setupEl.value || setupEl.innerText || setupEl.innerHTML;
                     if(execEl) execCode = execEl.value || execEl.innerText || execEl.innerHTML;
		  
                     self.setupText.value = setupCode;
                     self.execText.value = execCode;
                     self.currentExampleSrc = exampleSrc;
                  });
               }
         });
       
      };
    
    
      libdraw.util.ext(libdraw.examples.ui.CodeEditor, {
         loadExamples: function(){
       
         }
      });
    
  })(jQuery);
