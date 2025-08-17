#!/bin/bash

echo "🔍 Diagnostic Ngrok"
echo "=================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Vérifier l'installation
echo -e "\n${BLUE}1. Vérification de l'installation Ngrok${NC}"
if command -v ngrok &> /dev/null; then
    echo -e "${GREEN}✅ Ngrok installé${NC}"
    ngrok version
else
    echo -e "${RED}❌ Ngrok non installé${NC}"
    echo "Installation: brew install ngrok/ngrok/ngrok"
    exit 1
fi

# 2. Vérifier la configuration
echo -e "\n${BLUE}2. Vérification de la configuration${NC}"
if ngrok config check &> /dev/null; then
    echo -e "${GREEN}✅ Configuration Ngrok valide${NC}"
else
    echo -e "${RED}❌ Configuration Ngrok invalide${NC}"
    echo "Configurez votre token: ngrok config add-authtoken VOTRE_TOKEN"
    exit 1
fi

# 3. Nettoyer les processus existants
echo -e "\n${BLUE}3. Nettoyage des processus existants${NC}"
pkill -f ngrok 2>/dev/null
sleep 2
echo -e "${GREEN}✅ Processus nettoyés${NC}"

# 4. Démarrer un serveur de test
echo -e "\n${BLUE}4. Démarrage d'un serveur de test${NC}"
python3 -m http.server 8080 &> /dev/null &
TEST_SERVER_PID=$!
sleep 2

if curl -s http://localhost:8080 &> /dev/null; then
    echo -e "${GREEN}✅ Serveur de test démarré sur le port 8080${NC}"
else
    echo -e "${RED}❌ Impossible de démarrer le serveur de test${NC}"
    kill $TEST_SERVER_PID 2>/dev/null
    exit 1
fi

# 5. Tester Ngrok
echo -e "\n${BLUE}5. Test de Ngrok${NC}"
echo "Démarrage de Ngrok..."

# Démarrer Ngrok en arrière-plan
ngrok http 8080 > /tmp/ngrok-test.log 2>&1 &
NGROK_PID=$!

# Attendre que Ngrok démarre
for i in {1..15}; do
    echo -n "."
    if curl -s http://localhost:4040/api/tunnels &> /dev/null; then
        echo -e "\n${GREEN}✅ Ngrok démarré avec succès${NC}"
        break
    fi
    
    if [ $i -eq 15 ]; then
        echo -e "\n${RED}❌ Ngrok n'a pas démarré dans les temps${NC}"
        echo "Logs Ngrok:"
        cat /tmp/ngrok-test.log
        kill $NGROK_PID $TEST_SERVER_PID 2>/dev/null
        exit 1
    fi
    
    sleep 1
done

# 6. Vérifier l'API Ngrok
echo -e "\n${BLUE}6. Test de l'API Ngrok${NC}"
API_RESPONSE=$(curl -s http://localhost:4040/api/tunnels)

if [ ! -z "$API_RESPONSE" ]; then
    echo -e "${GREEN}✅ API Ngrok répond${NC}"
    echo "Réponse de l'API:"
    echo "$API_RESPONSE" | head -5
    
    # Extraire l'URL
    NGROK_URL=$(echo "$API_RESPONSE" | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
    
    if [ ! -z "$NGROK_URL" ]; then
        echo -e "${GREEN}✅ URL Ngrok trouvée: $NGROK_URL${NC}"
        
        # Tester l'accès externe
        echo -e "\n${BLUE}7. Test de l'accès externe${NC}"
        if curl -s "$NGROK_URL" &> /dev/null; then
            echo -e "${GREEN}✅ Accès externe fonctionnel${NC}"
            echo -e "${GREEN}🎉 Ngrok fonctionne parfaitement !${NC}"
        else
            echo -e "${YELLOW}⚠️  URL trouvée mais accès externe échoue${NC}"
        fi
    else
        echo -e "${RED}❌ Impossible d'extraire l'URL Ngrok${NC}"
    fi
else
    echo -e "${RED}❌ API Ngrok ne répond pas${NC}"
fi

# 8. Dashboard
echo -e "\n${BLUE}8. Dashboard Ngrok${NC}"
echo "Ouvrez http://localhost:4040 dans votre navigateur"

# Nettoyage
cleanup() {
    echo -e "\n${YELLOW}🧹 Nettoyage...${NC}"
    kill $NGROK_PID $TEST_SERVER_PID 2>/dev/null
    echo -e "${GREEN}✅ Nettoyage terminé${NC}"
}

trap cleanup EXIT

# Garder en vie pour permettre les tests
echo -e "\n${YELLOW}💡 Appuyez sur Ctrl+C pour arrêter le test${NC}"
wait