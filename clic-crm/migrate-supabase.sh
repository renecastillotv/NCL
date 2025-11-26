#!/bin/bash
# Script para migrar imports de Supabase a centralizado

FILES=(
  "src/components/CRMUsers.js"
  "src/components/PropertyContent.js"
  "src/components/PropertyDetail.js"
  "src/components/PropertyEditModal.js"
  "src/components/PropertyGeneral.js"
  "src/components/PropertyProject.js"
  "src/components/PropertySEO.js"
  "src/components/SEOContentManager.js"
  "src/components/VideoManager.js"
  "src/components/RelationsTab.js"
  "src/components/TagsRelation.js"
  "src/components/TagsGeneral.js"
  "src/components/FAQEditor.js"
  "src/components/ArticleEditor.js"
  "src/components/TestimonialEditor.js"
  "src/components/DealsManager.js"
  "src/components/DealCommissions.js"
  "src/components/DealDetails.js"
  "src/components/DealExpediente.js"
  "src/components/EmailAccountsManager.js"
  "src/components/EmailInbox.js"
  "src/components/LoginPage.js"
  "src/components/UserCreatePage.js"
  "src/components/UserEditPage.js"
  "src/components/PropertyLocationManager.js"
  "src/components/PropertyCreateWizard.js"
  "src/components/PropertyCreation/PropertyCreateModal.js"
  "src/components/location/DataCleanup.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Migrating: $file"

    # Eliminar import de createClient
    sed -i "s/import { createClient } from '@supabase\/supabase-js';//g" "$file"

    # Eliminar configuración de Supabase
    sed -i "/\/\/ Configuración de Supabase/d" "$file"
    sed -i "/const supabaseUrl = 'https:\/\/pacewqgypevfgjmdsorz.supabase.co';/d" "$file"
    sed -i "/const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.*/d" "$file"

    # Reemplazar creación de supabase por import
    sed -i "s/const supabase = createClient(supabaseUrl, supabaseAnonKey);/import { supabase } from '..\/services\/api';/g" "$file"

    echo "  ✓ Done"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo ""
echo "Migration complete!"
