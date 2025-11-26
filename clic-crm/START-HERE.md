# 🚀 CRM v2.0 - START HERE

## ⚡ Quick Start

### 1️⃣ Crear Backup (5 min)

```powershell
# Abrir PowerShell en: c:\Users\Rene Castillo

# Crear backup
$backup = "clic-crm-backup-$(Get-Date -Format 'yyyyMMdd-HHmm')"
New-Item -ItemType Directory -Path $backup
robocopy "clic-crm\src" "$backup\src" /E /XD node_modules
Copy-Item "clic-crm\package.json" "$backup\"
"Backup: $(Get-Date)" > "$backup\INFO.txt"

Write-Host "✅ Backup creado: $backup"
```

### 2️⃣ Leer Arquitectura (2 min)

Lee: **[CRM-V2-ARCHITECTURE.md](CRM-V2-ARCHITECTURE.md)**

Entiende:
- Nueva estructura (40 archivos vs 73)
- Flujo: Login → Dashboard → Módulos
- Permisos manejados por edge functions
- Diseño visual se mantiene (naranja #f04e00)

### 3️⃣ Sprint 1: Login + Dashboard (HOY)

Vamos a crear:
- ✅ LoginPage con Supabase Auth
- ✅ useAuth hook con get-user-permissions
- ✅ Layout (Sidebar + Header + Content)
- ✅ Dashboard con perfil y roles
- ✅ Navegación por módulos según rol

**Tiempo estimado:** 2-3 horas

### 4️⃣ Confirmar para Empezar

Di "listo" y empiezo a generar los archivos del Sprint 1.

---

## 📋 Checklist

- [ ] Backup creado
- [ ] Arquitectura revisada
- [ ] Edge functions deployadas (ya ✅)
- [ ] Secrets configurados en Supabase (ya ✅)
- [ ] Listo para empezar Sprint 1

---

**¿Listo? Dime y empiezo a crear los componentes** 🎯
