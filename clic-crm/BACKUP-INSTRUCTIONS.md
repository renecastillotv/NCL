# 📦 Backup del CRM Actual - Antes de v2.0

## Crear Backup Completo

### En PowerShell:

```powershell
# Ir al directorio padre
cd "c:\Users\Rene Castillo"

# Crear carpeta de backup con fecha
$backupFolder = "clic-crm-backup-$(Get-Date -Format 'yyyyMMdd-HHmm')"
New-Item -ItemType Directory -Path $backupFolder

# Copiar src/ completo (sin node_modules)
robocopy "clic-crm\src" "$backupFolder\src" /E /XD node_modules

# Copiar archivos importantes
Copy-Item "clic-crm\package.json" "$backupFolder\"
Copy-Item "clic-crm\package-lock.json" "$backupFolder\"
Copy-Item "clic-crm\README.md" "$backupFolder\"
Copy-Item "clic-crm\.env.example" "$backupFolder\"

# Crear archivo de referencia
"Backup creado: $(Get-Date)" | Out-File "$backupFolder\BACKUP-INFO.txt"
"Componentes: 73 archivos" | Out-File "$backupFolder\BACKUP-INFO.txt" -Append
"CRM Version: 1.0 (pre-refactor)" | Out-File "$backupFolder\BACKUP-INFO.txt" -Append

Write-Host "✅ Backup creado en: $backupFolder"
```

### Verificar Backup:

```powershell
# Contar archivos copiados
Get-ChildItem -Path $backupFolder -Recurse -File | Measure-Object
```

## ¿Qué se Respalda?

- ✅ Todos los componentes (73 archivos)
- ✅ Configuración de roles (RolesConfig.js)
- ✅ Estilos y UI components
- ✅ package.json con dependencias
- ✅ Estructura completa de src/

## ¿Qué NO se Respalda?

- ❌ node_modules/ (se puede reinstalar)
- ❌ .git/ (ya está en Git)
- ❌ supabase/functions/ (ya está deployado)

## Restaurar (si es necesario)

```powershell
# Si algo sale mal, restaurar desde backup
robocopy "$backupFolder\src" "clic-crm\src" /E
```

---

**Creado:** 2025-10-25
**Propósito:** Backup antes de refactorizar a CRM v2.0 con edge functions
