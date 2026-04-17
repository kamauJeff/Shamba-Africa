import { useState } from 'react'
import { Users, Plus, Loader2 } from 'lucide-react'
import { useGroups, useMyGroups, useJoinGroup } from '@/hooks/useApi'
import { formatKes, formatDate } from '@/lib/utils'

const GROUP_TYPES=['SACCO','COOPERATIVE','BUYING_GROUP','IRRIGATION_SCHEME']
const TYPE_COLORS: Record<string,string> = { SACCO:'badge-green', COOPERATIVE:'badge-blue', BUYING_GROUP:'badge-amber', IRRIGATION_SCHEME:'badge-gray' }

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroups()
  const { data: myGroups } = useMyGroups()
  const myGroupIds = new Set(myGroups?.map((m:any)=>m.groupId))

  return (
    <div className="page-fade space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="font-display text-2xl font-semibold">Farmer Groups</h1><p className="text-gray-500 text-sm mt-1">SACCOs, cooperatives and buying groups near you</p></div>
      </div>
      {myGroups && myGroups.length>0 && (
        <div className="card p-5">
          <h2 className="font-semibold mb-3">My groups</h2>
          <div className="flex flex-wrap gap-3">
            {myGroups.map((m:any)=>(
              <div key={m.groupId} className="rounded-xl bg-shamba-50 border border-shamba-100 px-4 py-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-shamba-600"/>
                <span className="text-sm font-medium text-shamba-800">{m.group?.name}</span>
                <span className="text-xs text-shamba-500 capitalize">{m.role.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1,2,3].map(i=><div key={i} className="skeleton h-40 rounded-2xl"/>)}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups?.map((g:any)=>{
          const isMember = myGroupIds.has(g.id)
          const join = useJoinGroup(g.id)
          return (
            <div key={g.id} className="card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-shamba-100 flex items-center justify-center shrink-0"><Users className="h-5 w-5 text-shamba-600"/></div>
                  <div><p className="font-semibold">{g.name}</p><p className="text-xs text-gray-500 mt-0.5">{g.county}</p></div>
                </div>
                <span className={TYPE_COLORS[g.type]??'badge-gray'}>{g.type.replace('_',' ')}</span>
              </div>
              {g.description&&<p className="text-sm text-gray-500 mb-3 line-clamp-2">{g.description}</p>}
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-3 text-gray-400">
                  <span>{g._count?.members??0} members</span>
                  <span>·</span>
                  <span>{formatKes(g.totalSavingsKes)} saved</span>
                </div>
                {!isMember ? (
                  <button onClick={()=>join.mutate()} disabled={join.isPending} className="btn-outline text-xs py-1 px-3">
                    {join.isPending&&<Loader2 className="h-3 w-3 animate-spin"/>}Join
                  </button>
                ) : <span className="badge-green">Member</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
