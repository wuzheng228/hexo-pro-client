"use strict";(self.webpackChunkarco_design_pro=self.webpackChunkarco_design_pro||[]).push([[766,602],{63462:function(e,t,n){var r=n(42982),o=n(70885),a=n(4519),i=n(24422),c=n(8965),l=n(90722),u=n(46138),s=n(69451),f=n(63193),d=n(7538),g=n(63258),p=n(46376),m=u.Qf.define([{tag:f.pJ.heading1,fontSize:"1.6em",fontWeight:"bold"},{tag:f.pJ.heading2,fontSize:"1.4em",fontWeight:"bold"},{tag:f.pJ.heading3,fontSize:"1.2em",fontWeight:"bold"}]);t.Z=function(e){var t=e.initialValue,n=(e.adminSettings,e.setRendered),f=e.handleChangeContent,h=e.handleScroll,v=e.forceLineNumbers,Z=(0,a.useRef)(null);function E(e){for(var t=e;t;){if(!(t.scrollHeight<=t.clientHeight))return t;t=t.parentNode}}var y=(0,a.useState)(null),b=(0,o.Z)(y,2),k=b[0],w=b[1],S=(0,a.useState)(null),M=(0,o.Z)(S,2),C=M[0],x=M[1];return(0,a.useEffect)((function(){if(Z){var e=new s.F6,o=s.yy.create({doc:t,extensions:[i.tk.lineWrapping,d.sy,i.$f.of([].concat((0,r.Z)(g.wQ),[{key:"Tab",preventDefault:!0,run:g.at},{key:"Shift-Tab",preventDefault:!0,run:g.xi}])),e.of([(0,i.Eu)(),c.Xy,i.tk.lineWrapping]),(0,i.ZO)(),(0,i.HQ)(),(0,u.nF)(m),(0,l.JH)({base:l.eg}),i.tk.updateListener.of((function(e){e.docChanged&&(n(e.state.doc.toString()),f(e.state.doc.toString()))})),i.tk.domEventHandlers({scroll:function(e,t){h(E(document.querySelector("#markdown > div > div.cm-scroller")).scrollTop/E(document.querySelector("#markdown > div > div.cm-scroller")).scrollHeight)},paste:function(e,t){var n=e.clipboardData.items;if(n.length){for(var r,o=n.length-1;o>=0;o--)if("file"==n[o].kind){r=n[o].getAsFile();break}if(r){var a=new FileReader;a.onload=function(e){(function(e,t){return new Promise((function(n,r){p.ZP.post("/hexopro/api/images/upload",{data:e,filename:t}).then((function(e){n(e.data)}))}))})(e.target.result,null).then((function(e){var n=t.state.replaceSelection("\n![".concat(e.msg,"](").concat(e.src,")"));t.update([t.state.update(n)])}))},a.readAsDataURL(r)}}}})]}),a=new i.tk({parent:Z.current,state:o});return w(a),x(e),function(){return a.destroy()}}}),[Z]),(0,a.useEffect)((function(){k&&C&&(v?k.dispatch({effects:C.reconfigure([(0,i.Eu)(),c.Xy,i.tk.lineWrapping])}):k.dispatch({effects:C.reconfigure([])}))}),[k,v]),(0,a.useEffect)((function(){if(k&&t){var e=k.state.update({changes:{from:0,to:k.state.doc.length,insert:t},selection:k.state.selection});k.dispatch(e)}}),[t,k]),[Z,k]}},70808:function(e,t,n){n.r(t),n.d(t,{FrontMatterAdder:function(){return p}});var r=n(1413),o=n(70885),a=(n(47872),n(82357)),i=(n(58186),n(3024)),c=(n(35749),n(29413)),l=(n(70198),n(52861)),u=(n(35495),n(79431)),s=(n(63793),n(79721)),f=(n(39340),n(34998)),d=n(4519),g=(n(93602),f.Z.Group);function p(e){var t=e.visible,n=e.onClose,p=e.title,m=e.existFrontMatter,h=e.frontMatter,v=e.onChange,Z=(0,d.useState)(!1),E=(0,o.Z)(Z,2),y=E[0],b=E[1],k=(0,d.useState)(""),w=(0,o.Z)(k,2),S=w[0],M=w[1],C=(0,d.useState)(""),x=(0,o.Z)(C,2),P=x[0],O=x[1];(0,d.useEffect)((function(){b(t)}),[t]);var _=function(){if(0!=S.trim().length){var e=(0,r.Z)({},h);e[S]=P,v(e)}};return y&&d.createElement(a.Z,{title:p,bordered:!0,hoverable:!0,style:{position:"absolute",top:"100%",zIndex:100,width:"100%"},extra:d.createElement(i.Z,null,d.createElement(l.Z,{placeholder:"frontMatter Key",value:S,onChange:function(e){return M(e)},onPressEnter:_}),d.createElement(l.Z,{placeholder:"frontMatter value",value:P,onChange:function(e){return O(e)},onPressEnter:_}),d.createElement(c.Z,{type:"text",onClick:function(){b(!1),n()}},"X"))},function e(){var t=Object.keys(m);return d.createElement(g,{onChange:function(t){var n={};t.forEach((function(t){n[t]=e[t]?e[t]:null})),v(n)},value:Object.keys(h)},t.map((function(e,t){return d.createElement(f.Z,{key:e,value:e},(function(t){var n=t.checked;return d.createElement(u.Z,{key:e,content:h[e]?h[e]:"unset"},d.createElement(s.Z,{key:e,color:n?"purple":"",style:{marginBottom:5}},e))}))})))}())}},59302:function(e,t,n){n.r(t);var r=n(70885),o=(n(45506),n(3358)),a=n(79704),i=(n(84094),n(6438)),c=n(42499),l=n(31672),u=(n(35749),n(29413)),s=(n(43570),n(94294)),f=n(63462),d=n(46376),g=n(4519),p=n(76082),m=(n(93602),n(42374)),h=(n(86074),n(32048)),v=n.n(h),Z=n(16893),E=n(9949),y=s.Z.Row,b=s.Z.Col,k=u.Z.Group;t.default=function(){var e=(0,p.k6)(),t=(0,g.useRef)(null),n=(0,g.useRef)(null),s=(0,p.UO)()._id,h=(0,g.useState)({isDraft:!0,source:null}),w=(0,r.Z)(h,2),S=(w[0],w[1]),M=(0,g.useState)({tags:[],categories:[],frontMatter:{},source:""}),C=(0,r.Z)(M,2),x=C[0],P=C[1],O=(0,g.useState)([]),_=(0,r.Z)(O,2),B=(_[0],_[1]),R=(0,g.useState)(""),T=(0,r.Z)(R,2),z=T[0],F=T[1],L=(0,g.useState)(""),W=(0,r.Z)(L,2),j=W[0],H=W[1],X=(0,g.useState)(""),A=(0,r.Z)(X,2),I=A[0],D=A[1],U=(0,g.useState)(""),J=(0,r.Z)(U,2),N=(J[0],J[1]),V=(0,g.useState)(""),Q=(0,r.Z)(V,2),q=Q[0],G=Q[1],$=(0,g.useState)({}),K=(0,r.Z)($,2),Y=(K[0],K[1]),ee=(0,g.useState)(!1),te=(0,r.Z)(ee,2),ne=te[0],re=te[1],oe=(0,g.useState)(!1),ae=(0,r.Z)(oe,2),ie=ae[0],ce=ae[1],le=function(e){return new Promise((function(t,n){d.Xn.get("/hexopro/api/pages/"+e).then((function(e){t(e.data)})).catch((function(e){n(e)}))}))},ue=function(e,t){if("pageMeta"==e)return P(t),void B(Object.keys(t.frontMatter));if("page"==e){var n=t.raw.split("---"),r=""===n[0]?2:1,o=n.slice(r).join("---").trim();D(t.title),N(o),G(o),S(t);var a=t._content;F(a)}};(0,g.useEffect)((function(){var e={page:le(s),pageMeta:new Promise((function(e,t){d.Xn.get("/hexopro/api/pageMeta/"+s).then((function(t){e(t.data)})).catch((function(e){t(e)}))}))};Object.keys(e).forEach((function(t){Promise.resolve(e[t]).then((function(e){var n={};n[t]=e,Y(n),ue&&ue(t,e)}))}))}),[]),(0,g.useEffect)((function(){var e=v().debounce((function(e){!function(e){new Promise((function(t,n){d.Xn.post("/hexopro/api/pages/"+s,e).then((function(e){t(e.data)})).catch((function(e){n(e)}))}))}(e)}),1e3,{trailing:!0,loading:!0});t.current=e}),[]);var se=(0,f.Z)({initialValue:z,adminSettings:{editor:{lineNumbers:!0}},setRendered:G,handleChangeContent:function(e){e!==q&&(G(e),t.current({_content:e}))},handleScroll:function(e){var t=document.getElementById("preview").getBoundingClientRect().height;document.getElementById("preview").scrollTop=(document.getElementById("preview").scrollHeight-t)*e},forceLineNumbers:ie}),fe=(0,r.Z)(se,2),de=fe[0];return fe[1],(0,g.useEffect)((function(){var e={code:function(e,t){var n=m.Z.getLanguage(t)?t:"plaintext";return"<pre><code>".concat(m.Z.highlight(e,{language:n}).value,"</code></pre>")}};E.TU.use({renderer:e}),E.TU.use({pedantic:!1,gfm:!0,breaks:!0}),H((0,E.TU)(q))}),[q]),g.createElement("div",null,g.createElement(y,{style:{width:"100%",borderBottomColor:"black",borderBottom:"1px solid gray",backgroundColor:"white"},align:"center"},g.createElement(b,{span:12},g.createElement("input",{style:{width:"100%",height:60,border:"none",outline:"none",boxSizing:"border-box",fontSize:28,fontWeight:500,marginLeft:10},value:I,onChange:function(e){var n;(n=e).target.value!=I&&(D(n.target.value),t.current({title:n.target.value}))}})),g.createElement(b,{span:2,offset:9,style:{alignItems:"center",justifyContent:"center",paddingLeft:50}},g.createElement(k,null,g.createElement(u.Z,{type:"outline",icon:g.createElement(l.Z,null),onClick:function(){return ce(!ie)}}),g.createElement(u.Z,{type:"outline",icon:g.createElement(c.Z,null),onClick:function(){return re(!0)}}))),g.createElement(b,{span:1},g.createElement(o.Z,{focusLock:!0,title:"\u786e\u8ba4\u5220\u9664",content:"\u786e\u8ba4\u5220\u9664\u9875\u9762\u5417?",onOk:function(){i.Z.info({content:"ok"}),new Promise((function(e,t){d.Xn.get("/hexopro/api/pages/"+s+"/remove").then((function(t){e(t.data)})).catch((function(e){t(e)}))})),e.push("/pages")},onCancel:function(){i.Z.error({content:"cancel"})}},g.createElement(u.Z,{type:"secondary",icon:g.createElement(a.Z,null)})))),g.createElement(y,{style:{boxSizing:"border-box",margin:0,backgroundColor:"white",height:"100vh",overflow:"hidden",width:"100%"}},g.createElement(y,{id:"editorWrapper",style:{width:"100%"}},g.createElement(b,{id:"markdown",span:12,ref:de,onMouseEnter:function(){return n.current="markdown"}}),g.createElement(b,{id:"preview",style:{overflowY:"hidden"},span:12,onMouseEnter:function(){return n.current="preview"},dangerouslySetInnerHTML:{__html:j}}))),g.createElement(Z.PageSettings,{visible:ne,setVisible:re,pageMeta:x,setPageMeta:P,handleChange:function(e){return new Promise((function(t,n){d.Xn.post("/hexopro/api/pages/"+s,e).then((function(e){t(e.data)})).catch((function(e){n(e)}))}))}}))}},16893:function(e,t,n){n.r(t),n.d(t,{PageSettings:function(){return v}});var r=n(1413),o=n(70885),a=(n(56710),n(86721)),i=(n(70198),n(52861)),c=(n(58186),n(3024)),l=(n(35749),n(29413)),u=(n(35495),n(79431)),s=(n(63793),n(79721)),f=(n(84094),n(6438)),d=(n(43570),n(94294)),g=n(4519),p=n(70808),m=d.Z.Row,h=d.Z.Col;function v(e){var t=e.visible,n=e.setVisible,d=e.pageMeta,v=e.setPageMeta,Z=e.handleChange,E=(0,g.useState)(!1),y=(0,o.Z)(E,2),b=y[0],k=y[1],w=(0,g.useState)([]),S=(0,o.Z)(w,2),M=S[0],C=S[1];return g.createElement(a.Z,{title:g.createElement("div",{style:{textAlign:"left"}},"\u6587\u7ae0\u5c5e\u6027"),visible:t,onCancel:function(){v((0,r.Z)((0,r.Z)({},d),{},{tags:[],categories:[],frontMatter:M})),n(!1)},onOk:function(){var e;e=d.source,/^([a-zA-Z0-9-_\/]+)\/([a-zA-Z0-9-_]+\.md)$/i.test(e)?(n(!1),Z({frontMatter:d.frontMatter,source:d.source})):f.Z.error("\u914d\u7f6e\u7684\u9875\u9762\u8def\u5f84\u975e\u6cd5\u8bf7\u68c0\u67e5\uff01")},afterOpen:function(){C(d.frontMatter)},style:{width:800}},g.createElement(m,{style:{marginTop:15,marginBottom:15}},g.createElement(h,null,g.createElement(c.Z,{style:{width:"100",flexWrap:"wrap"}},Object.keys(d.frontMatter).map((function(e){return g.createElement(u.Z,{key:e,content:d.frontMatter[e]?d.frontMatter[e]:"unset"},g.createElement(s.Z,{closable:!0,onClose:function(){return function(e){var t={};Object.keys(d.frontMatter).forEach((function(n){n!==e&&(t[n]=d.frontMatter[n])}));var n=(0,r.Z)((0,r.Z)({},d),{},{frontMatter:t});v(n)}(e)},key:e,color:"blue",style:{marginBottom:5}},e))})),g.createElement(l.Z,{type:"dashed",onClick:function(){k(!b)}},"+\u81ea\u5b9a\u4e49frontMatter")),g.createElement(p.FrontMatterAdder,{existFrontMatter:M,onClose:function(){k(!1)},visible:b,title:"Font-Matter",frontMatter:d.frontMatter,onChange:function(e){var t=(0,r.Z)((0,r.Z)({},d),{},{frontMatter:e});v(t)}}))),g.createElement(m,{style:{marginTop:15,marginBottom:15}},g.createElement(h,null,g.createElement(i.Z,{style:{width:350},allowClear:!0,placeholder:"\u8bf7\u8f93\u5165\u9875\u9762\u5b58\u653e\u8def\u5f84",value:d.source,onChange:function(e){var t=(0,r.Z)((0,r.Z)({},d),{},{source:e});v(t)}}))))}},93602:function(e,t,n){n.r(t),t.default={}}}]);
//# sourceMappingURL=766.37671182.chunk.js.map