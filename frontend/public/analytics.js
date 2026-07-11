(function(){
  var d=document,r=d.referrer||"",p=d.location.pathname;
  fetch("/api/analytics/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page:p,referrer:r})}).catch(function(){});
})();
