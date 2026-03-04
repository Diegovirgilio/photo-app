# Photo App - Frontend (React)

## 🚀 Setup do Frontend

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_API_URL=http://localhost:8000
```

> **Nota:** Em produção, altere para a URL do seu backend

### 3. Rodar o Servidor de Desenvolvimento

```bash
npm run dev
```

Aplicação rodando em: **http://localhost:3000**

### 4. Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`

---

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── Navbar.jsx
│   │   ├── PhotoCard.jsx
│   │   └── PrivateRoute.jsx
│   ├── contexts/         # Context API (estado global)
│   │   └── AuthContext.jsx
│   ├── pages/            # Páginas principais
│   │   ├── LoginPage.jsx
│   │   ├── GalleryPage.jsx
│   │   ├── UploadPage.jsx
│   │   ├── MyPhotosPage.jsx
│   │   └── AdminPage.jsx
│   ├── services/         # Integração com API
│   │   └── api.js
│   ├── App.jsx           # Rotas principais
│   ├── main.jsx          # Entry point
│   └── index.css         # Estilos globais
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🎨 Tecnologias Utilizadas

### **React** (v18)
- **Fundamento:** Biblioteca UI declarativa
- **Motivo:** Componentes reutilizáveis, Virtual DOM eficiente, ecossistema rico

### **Vite** (Build Tool)
- **Fundamento:** Next-generation bundler
- **Motivo:** HMR instantâneo, build 10x mais rápido que Webpack

### **React Router** (v6)
- **Fundamento:** Navegação client-side
- **Motivo:** SPA com múltiplas páginas, rotas protegidas

### **Axios**
- **Fundamento:** HTTP Client
- **Motivo:** Interceptors (adiciona token automaticamente), melhor que fetch

### **Tailwind CSS**
- **Fundamento:** Utility-first CSS
- **Motivo:** Desenvolvimento rápido, design consistente, bundle pequeno

### **React Icons**
- **Fundamento:** Biblioteca de ícones
- **Motivo:** Icons bonitos prontos para uso

### **React Image File Resizer**
- **Fundamento:** Compressão de imagens no cliente
- **Motivo:** Reduz tamanho antes do upload, economiza bandwidth

---

## 🔐 Fluxo de Autenticação

### **Como funciona:**

1. **Login/Registro:**
   - Usuário envia credenciais
   - Backend retorna JWT token
   - Token salvo no `localStorage`
   - Usuário redirecionado para galeria

2. **Requisições Autenticadas:**
   - Axios interceptor adiciona token automaticamente
   - Header: `Authorization: Bearer <token>`

3. **Expiração do Token:**
   - Token expira em 7 dias
   - Se API retorna 401, redireciona para login
   - Token é removido do localStorage

4. **Logout:**
   - Remove token do localStorage
   - Limpa estado do Context
   - Redireciona para login

---

## 📱 Páginas Implementadas

### **1. Login/Registro (`/login`)**
- Formulário único (toggle entre login e registro)
- Validação client-side
- Feedback de erros
- Redirect automático após login

### **2. Galeria Pública (`/`)**
- Lista todas as fotos de todos os usuários
- Grid responsivo (1-4 colunas)
- Sistema de likes
- Click na foto abre original em nova aba

### **3. Upload (`/upload`)**
- Seleção de arquivo (drag & drop)
- Preview da imagem
- Compressão automática (1920x1080, 85% quality)
- Barra de progresso
- Limite de 5 fotos

### **4. Minhas Fotos (`/my-photos`)**
- Mostra apenas fotos do usuário logado
- Indica quantas fotos faltam para o limite
- Link para upload
- Aviso quando atingir limite

### **5. Admin (`/admin`) - Apenas Admin**
- **Aba Usuários:**
  - Lista todos os usuários
  - Tornar/remover admin
  - Deletar usuário
- **Aba Fotos:**
  - Lista todas as fotos
  - Deletar qualquer foto

---

## 🎨 Componentes Reutilizáveis

### **PhotoCard**
Usado em: Gallery, MyPhotos, Admin

**Props:**
- `photo` - Objeto da foto
- `onPhotoUpdate` - Callback após like/unlike
- `onPhotoDelete` - Callback para deletar
- `showDelete` - Mostrar botão de deletar (admin)

**Features:**
- Thumbnail com aspect-ratio quadrado
- Info do dono (nome, avatar, data)
- Botão de like com contador
- Click abre imagem original

### **Navbar**
Usado em: Todas as páginas (exceto login)

**Features:**
- Logo e nome do app
- Links de navegação
- Link especial para admin (se for admin)
- Info do usuário logado
- Botão de logout

### **PrivateRoute**
Proteção de rotas

**Props:**
- `children` - Componente a renderizar
- `requireAdmin` - Requer permissão de admin

**Lógica:**
- Se não autenticado → redirect para login
- Se requer admin mas não é admin → redirect para home
- Loading enquanto verifica autenticação

---

## 🔄 Context API (Estado Global)

### **AuthContext**
Gerencia autenticação globalmente

**Estado:**
- `user` - Dados do usuário logado
- `loading` - Carregando estado inicial
- `isAuthenticated` - Boolean
- `isAdmin` - Boolean

**Métodos:**
- `login(email, password)` - Faz login
- `register(userData)` - Cria conta
- `logout()` - Faz logout
- `refreshUser()` - Atualiza dados do usuário

---

## 🚦 Como Funciona o Upload

### **Fluxo Completo:**

```
1. Usuário seleciona arquivo
     ↓
2. Validação client-side:
   - Formato (JPEG, PNG, WEBP)
   - Tamanho (máx 10MB)
     ↓
3. Compressão com Resizer:
   - Redimensiona para 1920x1080
   - Quality 85%
   - Converte para JPEG
     ↓
4. Preview da imagem
     ↓
5. Clica "Fazer Upload"
     ↓
6. FormData com arquivo comprimido
     ↓
7. POST /api/photos/upload
   - Progress callback atualiza barra
     ↓
8. Backend processa:
   - Comprime novamente (garantia)
   - Cria thumbnail
   - Upload para Supabase
   - Salva URLs no banco
     ↓
9. Sucesso → Redirect para "Minhas Fotos"
```

---

## 🎯 Próximos Passos (Mobile)

Este frontend foi pensado para facilitar a migração para **React Native**:

✅ **Lógica separada** - `services/api.js` reutilizável
✅ **Context API** - Funciona igual no React Native
✅ **Componentes simples** - Fácil converter para React Native components
✅ **Axios** - Mesma lib funciona no mobile

**Para converter:**
1. Criar projeto React Native
2. Copiar `services/` e `contexts/`
3. Reescrever componentes com React Native components
4. Adaptar navegação (React Navigation)

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to backend"
- Verifique se backend está rodando em `localhost:8000`
- Confira `VITE_API_URL` no `.env`

### Erro: "Network Error"
- Backend deve ter CORS habilitado
- Verifique `allow_origins` no backend

### Imagens não carregam
- Verifique se Supabase Storage está configurado
- Bucket deve ser público
- URLs devem ser acessíveis

### Token expirado
- Token expira em 7 dias
- Faça logout e login novamente

---

## ⚡ Deploy

### **Vercel (Recomendado)**

```bash
npm install -g vercel
vercel
```

Configure variáveis de ambiente:
- `VITE_API_URL` = URL do backend em produção

### **Netlify**

```bash
npm run build
# Upload pasta dist/ para Netlify
```

---

## 📚 Recursos

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)

---

🎉 **Frontend completo e pronto para uso!**
