import { testSupabaseConnection } from '../config/supabase.js';
import config from '../config/env.js';

async function runDbTest() {
  console.log('==================================================');
  console.log('🔍 Testing Supabase Database Connection...');
  console.log(`🌐 Project URL: ${config.supabase.url ? config.supabase.url : '[NOT CONFIGURED]'}`);
  console.log('==================================================\n');

  const result = await testSupabaseConnection();

  if (result.success) {
    console.log('✅ STATUS: CONNECTED');
    console.log(`💬 Message: ${result.message}`);
    console.log('📊 Details:');
    console.log(`   - Auth Service:  ${result.details.authStatus}`);
    console.log(`   - REST Service:  ${result.details.restStatus}`);
    console.log(`   - Anon Key:      Configured`);
    console.log(`   - Service Role:  ${result.details.serviceRoleKeyConfigured ? 'Configured (Server-only)' : 'Not configured (Optional)'}`);
    console.log('\n🎉 Supabase connection is healthy and ready for backend operations!');
    process.exit(0);
  } else {
    console.error('❌ STATUS: CONNECTION FAILED');
    console.error(`💬 Message: ${result.message}`);
    console.error(`⚠️ Error:   ${result.details.error}`);
    console.error('\n🛠️ Troubleshooting Steps:');
    console.error('   1. Open D:/ResourceLoop/.env');
    console.error('   2. Set SUPABASE_URL to your Supabase Project URL (e.g. https://xyz.supabase.co)');
    console.error('   3. Set SUPABASE_ANON_KEY to your Supabase anon/public API key');
    console.error('   4. (Optional) Set SUPABASE_SERVICE_ROLE_KEY for admin tasks');
    console.error('   5. Run this test again with: npm run test:db\n');
    process.exit(1);
  }
}

runDbTest();
