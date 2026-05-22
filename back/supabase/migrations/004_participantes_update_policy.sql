-- Permite a cada usuario autenticado actualizar únicamente su propio registro
create policy "Actualización propia"
  on public.participantes
  for update
  to authenticated
  using  (correo = (auth.jwt() ->> 'email'))
  with check (correo = (auth.jwt() ->> 'email'));
