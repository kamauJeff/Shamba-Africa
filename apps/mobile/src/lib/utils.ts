export const formatKes  = (n:number) => `KES ${new Intl.NumberFormat('en-KE',{minimumFractionDigits:0,maximumFractionDigits:0}).format(n)}`
export const formatDate = (d:string|Date) => new Intl.DateTimeFormat('en-KE',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d))
export const scorePercent = (s:number) => Math.round(((s-300)/550)*100)
export const creditColor  = (r:string) => ({'POOR':'#ef4444','FAIR':'#d97706','GOOD':'#ca8a04','VERY_GOOD':'#15a552','EXCELLENT':'#138544'}[r]??'#9ca3af')
export const loanStatusColor = (s:string):{bg:string;text:string} =>
  ({'PENDING':{bg:'#fef3c7',text:'#92400e'},'APPROVED':{bg:'#dbeafe',text:'#1e40af'},'ACTIVE':{bg:'#dcfce7',text:'#166534'},'CLOSED':{bg:'#f3f4f6',text:'#374151'},'DEFAULTED':{bg:'#fee2e2',text:'#991b1b'}}[s]??{bg:'#f3f4f6',text:'#374151'})
