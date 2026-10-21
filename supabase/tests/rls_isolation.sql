-- RLS isolation test for Jenny. Run in Supabase Dashboard > SQL Editor.
-- Creates 3 throwaway users inside a transaction, checks access rules, then ABORTS with the report,
-- so nothing is saved. Every line must read PASS. Any FAIL = do not ship.

do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  pid uuid; cid uuid; n int; msg text; res text := E'\n';

  procedure_dummy int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
   (a,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','a@test.invalid','{"username":"alice_t","display_name":"Alice"}',now(),now()),
   (b,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','b@test.invalid','{"username":"bob_t","display_name":"Bob"}',now(),now()),
   (c,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','c@test.invalid','{"username":"alice_t","display_name":"Dup"}',now(),now());

  select count(*) into n from public.profiles where id in (a,b,c);
  res := res || format('%s signup trigger created 3 profiles (got %s)%s', case when n=3 then 'PASS' else 'FAIL' end, n, E'\n');
  select count(*) into n from public.profiles where id=c and username like 'user\_%';
  res := res || format('%s duplicate username gets fallback name%s', case when n=1 then 'PASS' else 'FAIL' end, E'\n');

  -- Alice
  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated','aal','aal1')::text, true);
  set local role authenticated;
  insert into public.posts (author_id, body) values (a,'hello from alice') returning id into pid;
  begin insert into public.posts (author_id, body) values (b,'spoof'); res := res||'FAIL alice posted as bob'||E'\n';
  exception when others then res := res||'PASS cannot post as another user'||E'\n'; end;
  begin insert into public.admin_roles (user_id, role) values (a,'system_owner'); res := res||'FAIL self-granted admin'||E'\n';
  exception when others then res := res||'PASS cannot self-grant admin'||E'\n'; end;
  begin update public.profiles set status='active' where id=a; res := res||'FAIL updated ungranted column'||E'\n';
  exception when others then res := res||'PASS cannot update protected profile column (status)'||E'\n'; end;
  cid := public.start_conversation(b);
  insert into public.messages (conversation_id, sender_id, body) values (cid, a, 'secret hi');

  -- Bob
  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated','aal','aal1')::text, true);
  select count(*) into n from public.posts where id=pid;
  res := res || format('%s bob sees alice public post%s', case when n=1 then 'PASS' else 'FAIL' end, E'\n');
  update public.posts set body='hacked' where id=pid; get diagnostics n=row_count;
  res := res || format('%s bob cannot edit alice post (rows=%s)%s', case when n=0 then 'PASS' else 'FAIL' end, n, E'\n');
  delete from public.posts where id=pid; get diagnostics n=row_count;
  res := res || format('%s bob cannot delete alice post (rows=%s)%s', case when n=0 then 'PASS' else 'FAIL' end, n, E'\n');
  select count(*) into n from public.messages where conversation_id=cid;
  res := res || format('%s bob (participant) reads the conversation%s', case when n=1 then 'PASS' else 'FAIL' end, E'\n');

  -- Outsider (c)
  perform set_config('request.jwt.claims', json_build_object('sub',c,'role','authenticated','aal','aal1')::text, true);
  select count(*) into n from public.messages where conversation_id=cid;
  res := res || format('%s outsider cannot read messages (saw %s)%s', case when n=0 then 'PASS' else 'FAIL' end, n, E'\n');
  begin insert into public.messages (conversation_id, sender_id, body) values (cid,c,'intrude'); res := res||'FAIL outsider sent message'||E'\n';
  exception when others then res := res||'PASS outsider cannot send message'||E'\n'; end;
  select count(*) into n from public.admin_roles;
  res := res || format('%s non-staff cannot read admin_roles (saw %s)%s', case when n=0 then 'PASS' else 'FAIL' end, n, E'\n');
  select count(*) into n from public.notifications;
  res := res || format('%s cannot read others notifications (saw %s)%s', case when n=0 then 'PASS' else 'FAIL' end, n, E'\n');

  -- Private profile
  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated','aal','aal1')::text, true);
  update public.profiles set visibility='followers' where id=a;
  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated','aal','aal1')::text, true);
  select count(*) into n from public.posts where id=pid;
  res := res || format('%s non-follower cannot see private-profile post%s', case when n=0 then 'PASS' else 'FAIL' end, E'\n');
  select count(*) into n from public.profiles where id=a;
  res := res || format('%s non-follower cannot see private profile row%s', case when n=0 then 'PASS' else 'FAIL' end, E'\n');
  insert into public.follows (follower_id, followee_id) values (b,a);
  select status into msg from public.follows where follower_id=b and followee_id=a;
  res := res || format('%s follow of private profile is pending (got %s)%s', case when msg='pending' then 'PASS' else 'FAIL' end, msg, E'\n');
  select count(*) into n from public.posts where id=pid;
  res := res || format('%s pending follower cannot see post%s', case when n=0 then 'PASS' else 'FAIL' end, E'\n');
  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated','aal','aal1')::text, true);
  update public.follows set status='accepted' where follower_id=b and followee_id=a;
  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated','aal','aal1')::text, true);
  select count(*) into n from public.posts where id=pid;
  res := res || format('%s accepted follower sees post%s', case when n=1 then 'PASS' else 'FAIL' end, E'\n');

  -- Block
  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated','aal','aal1')::text, true);
  insert into public.user_blocks (blocker_id, blocked_id) values (a,b);
  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated','aal','aal1')::text, true);
  select count(*) into n from public.posts where id=pid;
  res := res || format('%s blocked user cannot see blocker post%s', case when n=0 then 'PASS' else 'FAIL' end, E'\n');
  begin insert into public.messages (conversation_id, sender_id, body) values (cid,b,'after block'); res := res||'FAIL blocked user messaged'||E'\n';
  exception when others then res := res||'PASS blocked user cannot message'||E'\n'; end;

  -- Anonymous
  reset role; set local role anon;
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  begin perform 1 from public.messages limit 1; res := res||'FAIL anon read messages'||E'\n';
  exception when insufficient_privilege then res := res||'PASS anon cannot read messages'||E'\n'; end;
  begin perform 1 from public.user_preferences limit 1; res := res||'FAIL anon read preferences'||E'\n';
  exception when insufficient_privilege then res := res||'PASS anon cannot read preferences'||E'\n'; end;

  reset role;
  raise exception '%', res;  -- aborts the transaction: all test data is discarded
end $$;
