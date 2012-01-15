(function($){
   var require = function(){
      for (var i  = 0; i < arguments.length; i++){
         try{
            var scr = document.createElement('script');
            scr.type='text/javascript';
            scr.src = arguments[i];
            document.body.appendChild(scr);
         }catch(e){
            alert(e);
            if(window.console){
               console.error(e);
            }
         }
      }
   };
   
   __LD_INIT_TESTS__ = function(){
      var tests = [];
      for(var i = 0; i < arguments.length; i++){
         tests.push('tests/'+arguments[i]);
      }
      require.apply(window,tests);
   };
   
})(jQuery);
