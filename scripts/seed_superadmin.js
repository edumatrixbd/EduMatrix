const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedSuperAdmin() {
  const email = 'kmsajid077@gmail.com'
  const password = 'ChangeMe123!' // User should change this immediately
  const fullName = 'KM Sajid'

  console.log(`Attempting to create superadmin: ${email}...`)

  // 1. Create user in Supabase Auth
  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      full_name: fullName,
      role: 'super_admin' 
    }
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists. Promoting to super_admin...')
      
      // Get the existing user
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users.find(u => u.email === email)
      
      if (existingUser) {
        // Update role in auth.users metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { user_metadata: { role: 'super_admin' } }
        )
        if (updateError) console.error('Error updating auth metadata:', updateError)

        // Update role in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'super_admin' })
          .eq('id', existingUser.id)
        
        if (profileError) console.error('Error updating profiles table:', profileError)
        
        console.log('User promoted successfully.')
      }
    } else {
      console.error('Error creating superadmin:', authError.message)
      process.exit(1)
    }
  } else {
    console.log('Superadmin account created successfully.')
    console.log(`Email: ${email}`)
    console.log('Password: ChangeMe123! (Please change this after login)')
  }
}

seedSuperAdmin()
