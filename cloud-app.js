export async function initSupabaseApp({supabase,userId,rupiah,dateToday,monthNow}){
  const status=document.querySelector('#cloudStatus');
  const transactionForm=document.querySelector('#transactionForm');
  const data={accounts:[],categories:[],transactions:[],budgets:[],debts:[],debt_payments:[],assets:[]};
  const defaultAccounts=[
    {name:'Tunai',account_type:'cash',opening_balance:0,currency:'IDR'},
    {name:'Rekening Bank',account_type:'bank',opening_balance:0,currency:'IDR'},
    {name:'E-Wallet',account_type:'e_wallet',opening_balance:0,currency:'IDR'}
  ];
  const defaultCategories=[
    {name:'Gaji',category_type:'income',icon:'wallet'},
    {name:'Usaha',category_type:'income',icon:'briefcase'},
    {name:'Bonus',category_type:'income',icon:'gift'},
    {name:'Lainnya',category_type:'income',icon:'circle'},
    {name:'Makanan',category_type:'expense',icon:'utensils'},
    {name:'Transportasi',category_type:'expense',icon:'car'},
    {name:'Tagihan',category_type:'expense',icon:'receipt'},
    {name:'Belanja',category_type:'expense',icon:'shopping-bag'},
    {name:'Kesehatan',category_type:'expense',icon:'heart-pulse'},
    {name:'Hiburan',category_type:'expense',icon:'ticket'},
    {name:'Pendidikan',category_type:'expense',icon:'book-open'},
    {name:'Lainnya',category_type:'expense',icon:'circle'}
  ];
  async function unwrap(query){
    const result=await query;
    if(result.error) throw result.error;
    return result.data||[];
  }
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const table=(rows,headers)=>{
    if(!rows.length)return '<div class="empty">Belum ada data untuk ditampilkan.</div>';
    return '<div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
  };
  const accountBalance=account=>{
    const movement=data.transactions.filter(t=>t.account_id===account.id).reduce((sum,t)=>sum+(t.transaction_type==='income'?Number(t.amount):t.transaction_type==='expense'?-Number(t.amount):0),0);
    return Number(account.opening_balance||0)+movement;
  };
  async function ensureDefaults(){
    const accounts=await unwrap(supabase.from('accounts').select('*').eq('user_id',userId).order('created_at'));
    if(!accounts.length)await unwrap(supabase.from('accounts').insert(defaultAccounts.map(a=>({...a,user_id:userId}))).select());
    const categories=await unwrap(supabase.from('categories').select('*').eq('user_id',userId));
    const typesPresent=new Set(categories.map(c=>c.category_type));
    const missingTypes=['income','expense'].filter(type=>!typesPresent.has(type));
    const missing=defaultCategories.filter(c=>missingTypes.includes(c.category_type));
    if(missing.length)await unwrap(supabase.from('categories').insert(missing.map(c=>({...c,user_id:userId,is_default:true}))).select());
  }
  async function loadAll(){
    const result=await Promise.all([
      unwrap(supabase.from('accounts').select('*').eq('user_id',userId).order('created_at')),
      unwrap(supabase.from('categories').select('*').eq('user_id',userId).order('category_type').order('name')),
      unwrap(supabase.from('transactions').select('*, account:accounts!transactions_account_id_fkey(id,name,account_type), category:categories!transactions_category_id_fkey(id,name,category_type)').eq('user_id',userId).order('transaction_date',{ascending:false}).order('created_at',{ascending:false})),
      unwrap(supabase.from('budgets').select('*, category:categories!budgets_category_id_fkey(id,name,category_type)').eq('user_id',userId).order('month',{ascending:false})),
      unwrap(supabase.from('debts').select('*').eq('user_id',userId).order('created_at',{ascending:false})),
      unwrap(supabase.from('debt_payments').select('*').eq('user_id',userId).order('payment_date',{ascending:false})),
      unwrap(supabase.from('assets').select('*').eq('user_id',userId).order('created_at',{ascending:false}))
    ]);
    data.accounts=result[0];data.categories=result[1];data.transactions=result[2];data.budgets=result[3];data.debts=result[4];data.debt_payments=result[5];data.assets=result[6];
    renderAll();
  }
  function fillCategorySelect(select,type,chosen){
    const options=data.categories.filter(c=>c.category_type===type);
    select.innerHTML=options.map(c=>'<option value="'+c.id+'">'+safe(c.name)+'</option>').join('');
    if(chosen&&options.some(c=>c.id===chosen))select.value=chosen;
    else if(options.length)select.value=options[0].id;
  }
  function fillAccountSelect(chosen){
    const select=document.querySelector('#txAccount');
    const active=data.accounts.filter(a=>!a.is_archived);
    select.innerHTML=active.map(a=>'<option value="'+a.id+'">'+safe(a.name)+'</option>').join('');
    if(chosen&&active.some(a=>a.id===chosen))select.value=chosen;
    else if(active.length)select.value=active[0].id;
  }
  function renderDashboard(){
    const currentMonth=monthNow();
    const monthly=data.transactions.filter(t=>t.transaction_date.startsWith(currentMonth));
    const income=monthly.filter(t=>t.transaction_type==='income').reduce((s,t)=>s+Number(t.amount),0);
    const expense=monthly.filter(t=>t.transaction_type==='expense').reduce((s,t)=>s+Number(t.amount),0);
    document.querySelector('#totalBalance').textContent=rupiah(data.accounts.reduce((s,a)=>s+accountBalance(a),0));
    document.querySelector('#monthIncome').textContent=rupiah(income);
    document.querySelector('#monthExpense').textContent=rupiah(expense);
    document.querySelector('#todayLabel').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  }
  function transactionTable(list,withActions){
    return table(list.map(t=>{
      const type=t.transaction_type,sign=type==='income'?'+':type==='expense'?'−':'↔';
      const amountClass=type==='income'?'income':type==='expense'?'expense':'';
      return '<tr><td>'+safe(t.transaction_date)+'</td><td>'+safe(t.description||t.category?.name||'Transaksi')+'</td><td>'+safe(t.category?.name||(type==='transfer'?'Transfer':'Tanpa kategori'))+'</td><td>'+safe(t.account?.name||'Rekening')+'</td><td class="amount '+amountClass+'">'+sign+rupiah(t.amount)+'</td>'+(withActions?'<td><button class="danger delete-tx" data-id="'+t.id+'" style="padding:6px 9px">Hapus</button></td>':'')+'</tr>';
    }),withActions?['Tanggal','Catatan','Kategori','Rekening','Nominal','Aksi']:['Tanggal','Catatan','Kategori','Rekening','Nominal']);
  }
  function renderTransactions(){
    const list=[...data.transactions];
    document.querySelector('#recentTransactions').innerHTML=transactionTable(list.slice(0,5),false);
    document.querySelector('#allTransactions').innerHTML=transactionTable(list,true);
    document.querySelectorAll('.delete-tx').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Hapus transaksi ini dari Supabase?'))return;
      button.disabled=true;
      try{await unwrap(supabase.from('transactions').delete().eq('id',button.dataset.id).eq('user_id',userId));await loadAll();statusMessage('Transaksi berhasil dihapus.');}
      catch(error){alert('Transaksi gagal dihapus: '+error.message);button.disabled=false;}
    }));
  }
  function renderAccounts(){
    const active=data.accounts.filter(a=>!a.is_archived);
    document.querySelector('#accountList').innerHTML=table(active.map(a=>{
      const count=data.transactions.filter(t=>t.account_id===a.id).length;
      return '<tr><td>'+safe(a.name)+'</td><td>'+count+' transaksi</td><td><strong>'+rupiah(accountBalance(a))+'</strong></td></tr>';
    }),['Rekening','Aktivitas','Saldo']);
    fillAccountSelect(document.querySelector('#txAccount').value);
  }
  function renderBudgets(){
    const monthStart=monthNow()+'-01';
    const currentBudgets=data.budgets.filter(b=>b.month===monthStart);
    document.querySelector('#budgetList').innerHTML=table(currentBudgets.map(b=>{
      const used=data.transactions.filter(t=>t.transaction_type==='expense'&&t.category_id===b.category_id&&t.transaction_date.startsWith(monthNow())).reduce((s,t)=>s+Number(t.amount),0);
      const cap=Number(b.amount)||0,pct=cap?Math.min(100,Math.round(used/cap*100)):0;
      return '<tr><td>'+safe(b.category?.name||'Kategori')+'</td><td>'+rupiah(used)+' / '+rupiah(cap)+'<div style="height:6px;background:#edf3ef;border-radius:9px;margin-top:7px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(used>cap?'#b33d42':'#166b50')+'"></div></div></td><td>'+pct+'%</td><td><button class="danger delete-budget" data-id="'+b.id+'" style="padding:6px 9px">Hapus</button></td></tr>';
    }),['Kategori','Pemakaian bulan ini','Terpakai','Aksi']);
    document.querySelectorAll('.delete-budget').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Hapus anggaran ini?'))return;
      try{await unwrap(supabase.from('budgets').delete().eq('id',button.dataset.id).eq('user_id',userId));await loadAll();statusMessage('Anggaran berhasil dihapus.');}
      catch(error){alert('Anggaran gagal dihapus: '+error.message);}
    }));
  }
  function renderDebts(){
    document.querySelector('#debtList').innerHTML=table(data.debts.map(d=>{
      return '<tr><td>'+(d.debt_type==='payable'?'Utang saya':'Piutang saya')+'</td><td>'+safe(d.title||d.person_name)+'</td><td>'+rupiah(d.outstanding_amount)+'</td><td>'+(safe(d.due_date)||'—')+'</td><td><button class="danger delete-debt" data-id="'+d.id+'" style="padding:6px 9px">Hapus</button></td></tr>';
    }),['Jenis','Keterangan','Sisa nominal','Jatuh tempo','Aksi']);
    document.querySelectorAll('.delete-debt').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Hapus catatan utang/piutang ini?'))return;
      try{
        await unwrap(supabase.from('debt_payments').delete().eq('debt_id',button.dataset.id).eq('user_id',userId));
        await unwrap(supabase.from('debts').delete().eq('id',button.dataset.id).eq('user_id',userId));
        await loadAll();statusMessage('Catatan utang/piutang berhasil dihapus.');
      }catch(error){alert('Catatan gagal dihapus: '+error.message);}
    }));
  }
  function renderAssets(){
    document.querySelector('#assetList').innerHTML=table(data.assets.map(a=>{
      return '<tr><td>'+safe(a.name)+'</td><td>'+safe(a.notes||'—')+'</td><td>'+rupiah(a.estimated_value)+'</td><td><button class="danger delete-asset" data-id="'+a.id+'" style="padding:6px 9px">Hapus</button></td></tr>';
    }),['Aset','Catatan','Estimasi nilai','Aksi']);
    document.querySelectorAll('.delete-asset').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Hapus aset ini?'))return;
      try{await unwrap(supabase.from('assets').delete().eq('id',button.dataset.id).eq('user_id',userId));await loadAll();statusMessage('Aset berhasil dihapus.');}
      catch(error){alert('Aset gagal dihapus: '+error.message);}
    }));
  }
  function renderReport(){
    const month=document.querySelector('#reportMonth').value||monthNow();
    const list=data.transactions.filter(t=>t.transaction_date.startsWith(month));
    const income=list.filter(t=>t.transaction_type==='income').reduce((s,t)=>s+Number(t.amount),0);
    const expense=list.filter(t=>t.transaction_type==='expense').reduce((s,t)=>s+Number(t.amount),0);
    const categories=[...new Set(list.filter(t=>t.transaction_type==='expense').map(t=>t.category?.name||'Tanpa kategori'))];
    document.querySelector('#reportSummary').innerHTML='<div class="stats"><article class="stat"><div class="label">Pemasukan</div><div class="value">'+rupiah(income)+'</div></article><article class="stat"><div class="label">Pengeluaran</div><div class="value">'+rupiah(expense)+'</div></article><article class="stat"><div class="label">Selisih</div><div class="value">'+rupiah(income-expense)+'</div></article></div>'+table(categories.map(name=>{
      const total=list.filter(t=>t.transaction_type==='expense'&&(t.category?.name||'Tanpa kategori')===name).reduce((s,t)=>s+Number(t.amount),0);
      return '<tr><td>'+safe(name)+'</td><td>'+rupiah(total)+'</td></tr>';
    }),['Kategori pengeluaran','Total']);
  }
  function renderAll(){
    fillCategorySelect(document.querySelector('#txCategory'),document.querySelector('#txType').value,document.querySelector('#txCategory').value);
    fillCategorySelect(document.querySelector('#budgetCategory'),'expense',document.querySelector('#budgetCategory').value);
    fillAccountSelect(document.querySelector('#txAccount').value);
    renderDashboard();renderTransactions();renderAccounts();renderBudgets();renderDebts();renderAssets();renderReport();
  }
  function goto(view){
    document.querySelectorAll('[id^="page-"]').forEach(el=>el.classList.add('hidden'));
    document.querySelector('#page-'+view).classList.remove('hidden');
    document.querySelectorAll('.nav').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
  }
  function statusMessage(message){
    status.textContent=message;status.style.background='#e2f3ea';status.style.color='#166b50';
  }
  async function refreshAfterChange(message){
    await loadAll();statusMessage(message||'Data berhasil disimpan ke Supabase.');
  }

  status.textContent='Menyiapkan rekening dan kategori awal…';status.style.background='';status.style.color='';
  await ensureDefaults();
  await loadAll();
  statusMessage('Tersambung ke Supabase. Data transaksi, anggaran, utang/piutang, dan aset disimpan di database akun ini.');

  document.querySelectorAll('.nav').forEach(button=>button.addEventListener('click',()=>goto(button.dataset.view)));
  document.querySelectorAll('[data-goto]').forEach(button=>button.addEventListener('click',()=>goto(button.dataset.goto)));
  document.querySelector('#quickAdd').addEventListener('click',()=>{goto('transactions');document.querySelector('#txAmount').focus();});
  document.querySelector('#txType').addEventListener('change',()=>fillCategorySelect(document.querySelector('#txCategory'),document.querySelector('#txType').value));
  transactionForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const amount=Number(document.querySelector('#txAmount').value);
    const accountId=document.querySelector('#txAccount').value;
    const categoryId=document.querySelector('#txCategory').value;
    if(!Number.isFinite(amount)||amount<=0){alert('Nominal harus lebih besar dari nol.');return;}
    if(!accountId){alert('Tidak ada rekening. Muat ulang halaman dan coba lagi.');return;}
    const row={user_id:userId,account_id:accountId,category_id:categoryId||null,transaction_type:document.querySelector('#txType').value,amount,transaction_date:document.querySelector('#txDate').value,description:document.querySelector('#txNote').value.trim()||null};
    const submit=transactionForm.querySelector('button[type="submit"]');submit.disabled=true;
    try{
      await unwrap(supabase.from('transactions').insert(row));
      transactionForm.reset();document.querySelector('#txDate').value=dateToday();
      fillCategorySelect(document.querySelector('#txCategory'),document.querySelector('#txType').value);
      await refreshAfterChange('Transaksi berhasil disimpan ke Supabase.');
    }catch(error){alert('Transaksi gagal disimpan: '+error.message);}
    finally{submit.disabled=false;}
  });
  document.querySelector('#budgetForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const categoryId=document.querySelector('#budgetCategory').value,amount=Number(document.querySelector('#budgetAmount').value);
    if(!categoryId||!Number.isFinite(amount)||amount<0){alert('Pilih kategori dan masukkan nominal yang valid.');return;}
    const monthStart=monthNow()+'-01',existing=data.budgets.find(b=>b.category_id===categoryId&&b.month===monthStart);
    const button=form.querySelector('button');button.disabled=true;
    try{
      if(existing)await unwrap(supabase.from('budgets').update({amount}).eq('id',existing.id).eq('user_id',userId));
      else await unwrap(supabase.from('budgets').insert({user_id:userId,category_id:categoryId,month:monthStart,amount}));
      form.reset();await refreshAfterChange('Anggaran berhasil disimpan ke Supabase.');
    }catch(error){alert('Anggaran gagal disimpan: '+error.message);}
    finally{button.disabled=false;}
  });
  document.querySelector('#debtForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const name=document.querySelector('#debtName').value.trim(),amount=Number(document.querySelector('#debtAmount').value);
    if(!name||!Number.isFinite(amount)||amount<=0){alert('Isi keterangan dan nominal yang valid.');return;}
    const debtType=document.querySelector('#debtType').value;
    const row={user_id:userId,debt_type:debtType==='utang'?'payable':'receivable',person_name:name,title:name,original_amount:amount,outstanding_amount:amount,start_date:dateToday(),due_date:document.querySelector('#debtDue').value||null,status:'active'};
    const button=form.querySelector('button');button.disabled=true;
    try{await unwrap(supabase.from('debts').insert(row));form.reset();await refreshAfterChange('Catatan utang/piutang tersimpan di Supabase.');}
    catch(error){alert('Catatan gagal disimpan: '+error.message);}
    finally{button.disabled=false;}
  });
  document.querySelector('#assetForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const name=document.querySelector('#assetName').value.trim(),value=Number(document.querySelector('#assetValue').value);
    if(!name||!Number.isFinite(value)||value<0){alert('Isi nama aset dan nilai yang valid.');return;}
    const row={user_id:userId,name,asset_type:'other',estimated_value:value,notes:document.querySelector('#assetNote').value.trim()||null};
    const button=form.querySelector('button');button.disabled=true;
    try{await unwrap(supabase.from('assets').insert(row));form.reset();await refreshAfterChange('Aset berhasil disimpan ke Supabase.');}
    catch(error){alert('Aset gagal disimpan: '+error.message);}
    finally{button.disabled=false;}
  });
  document.querySelector('#reportMonth').addEventListener('change',renderReport);

  const download=(filename,content,type)=>{
    const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const cleanRows=(rows,fields)=>rows.map(row=>Object.fromEntries(fields.filter(key=>row[key]!==undefined).map(key=>[key,row[key]])));
  const backupFields={
    accounts:['id','user_id','name','account_type','opening_balance','currency','color','is_archived'],
    categories:['id','user_id','name','category_type','icon','color','is_default'],
    transactions:['id','user_id','account_id','category_id','transfer_account_id','transaction_type','amount','transaction_date','description','merchant','reference_no'],
    budgets:['id','user_id','category_id','month','amount'],
    debts:['id','user_id','debt_type','person_name','title','original_amount','outstanding_amount','start_date','due_date','notes','status'],
    debt_payments:['id','user_id','debt_id','account_id','payment_date','amount','notes'],
    assets:['id','user_id','name','asset_type','estimated_value','purchase_date','notes']
  };
  document.querySelector('#exportCsv').addEventListener('click',()=>{
    const headers=['tanggal','jenis','nominal','kategori','rekening','catatan'];
    const quote=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
    const rows=data.transactions.map(t=>[t.transaction_date,t.transaction_type,t.amount,t.category?.name||'',t.account?.name||'',t.description||'']);
    download('transaksi-keuangan.csv','\ufeff'+[headers,...rows].map(row=>row.map(quote).join(';')).join('\r\n'),'text/csv;charset=utf-8');
  });
  document.querySelector('#exportJson').addEventListener('click',()=>{
    const backup={version:2,exported_at:new Date().toISOString()};
    for(const [name,fields] of Object.entries(backupFields))backup[name]=cleanRows(data[name]||[],fields);
    download('backup-keuangan-supabase.json',JSON.stringify(backup,null,2),'application/json');
  });
  document.querySelector('#importJson').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      const imported=JSON.parse(await file.text()),required=Object.keys(backupFields);
      if(imported.version!==2||required.some(name=>!Array.isArray(imported[name])))throw new Error('Format backup tidak cocok. Gunakan file backup JSON versi 2 dari aplikasi ini.');
      if(!imported.accounts.length||!imported.categories.length)throw new Error('Backup harus memuat setidaknya satu rekening dan satu kategori.');
      if(!confirm('Pulihkan backup Supabase? Semua data saat ini pada akun ini akan diganti dengan isi backup.'))return;
      status.textContent='Memulihkan backup…';status.style.background='';status.style.color='';
      const deleteOrder=['debt_payments','transactions','budgets','debts','assets','categories','accounts'];
      for(const name of deleteOrder)await unwrap(supabase.from(name).delete().eq('user_id',userId));
      const insertOrder=['accounts','categories','transactions','budgets','debts','assets','debt_payments'];
      for(const name of insertOrder){
        const rows=imported[name].map(row=>{const copy={...row,user_id:userId};delete copy.created_at;delete copy.updated_at;return copy;});
        if(rows.length)await unwrap(supabase.from(name).insert(rows));
      }
      await ensureDefaults();await refreshAfterChange('Backup berhasil dipulihkan ke Supabase.');
    }catch(error){
      alert('Pemulihan backup gagal: '+error.message);
      status.textContent='Pemulihan backup gagal. Periksa pesan error; sebagian data mungkin sudah berubah jika proses terhenti di tengah.';
      status.style.background='#fff0f0';status.style.color='#a52f38';
    }finally{event.target.value='';}
  });
}