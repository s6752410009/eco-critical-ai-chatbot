// Retire old public demo aliases. Classroom APIs require the primary site's session.
export default {fetch(request){
 const current=new URL(request.url);
 if(current.pathname.startsWith('/api/'))return Response.json({error:'ลิงก์ API เดิมปิดแล้ว กรุณาใช้ https://eco-critical.pages.dev'},{status:410,headers:{'Cache-Control':'no-store'}});
 const target=new URL('https://eco-critical.pages.dev');target.pathname=['/demo','/live','/'].includes(current.pathname)?'/app':current.pathname;target.search=current.search;
 return Response.redirect(target.toString(),308);
}};
