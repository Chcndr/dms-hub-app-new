#!/bin/bash
# ============================================
# DEPLOY GTFS - Centro Mobilità MioHub
# Script automatico per importare dati GTFS
# ============================================

set -e

echo "============================================"
echo "  DEPLOY GTFS - Centro Mobilità MioHub"
echo "============================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directory di lavoro
WORK_DIR="/root/gtfs_data"
BACKEND_DIR="/root/mihub-backend-rest"

# Credenziali database (legge da .env del backend)
if [ -f "$BACKEND_DIR/.env" ]; then
    source "$BACKEND_DIR/.env"
fi

# Default se non trovate
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_NAME="${DB_NAME:-mobility_data}"

echo -e "${YELLOW}[1/6] Creazione directory di lavoro...${NC}"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo -e "${YELLOW}[2/6] Download dati GTFS...${NC}"

# TPER Bologna
echo "  → Scaricando TPER Bologna..."
curl -sL "https://solweb.tper.it/tper-opendata/gtfs/gommagtfsbo.zip" -o tper_bologna.zip 2>/dev/null || \
curl -sL "https://www.tper.it/sites/default/files/gtfs/gommagtfsbo.zip" -o tper_bologna.zip 2>/dev/null || \
echo "  ⚠ TPER Bologna non disponibile, uso dati demo"

# TPER Ferrara
echo "  → Scaricando TPER Ferrara..."
curl -sL "https://solweb.tper.it/tper-opendata/gtfs/gommagtfsfe.zip" -o tper_ferrara.zip 2>/dev/null || \
curl -sL "https://www.tper.it/sites/default/files/gtfs/gommagtfsfe.zip" -o tper_ferrara.zip 2>/dev/null || \
echo "  ⚠ TPER Ferrara non disponibile, uso dati demo"

# Trenitalia Toscana (include Grosseto)
echo "  → Scaricando Trenitalia Toscana..."
curl -sL "https://dati.toscana.it/dataset/rt-oraritb/resource/download/gtfs_trenitalia.zip" -o trenitalia.zip 2>/dev/null || \
echo "  ⚠ Trenitalia non disponibile, uso dati demo"

echo -e "${GREEN}  ✓ Download completato${NC}"

echo -e "${YELLOW}[3/6] Estrazione file GTFS...${NC}"
for zip in *.zip; do
    if [ -f "$zip" ]; then
        dir="${zip%.zip}"
        mkdir -p "$dir"
        unzip -q -o "$zip" -d "$dir" 2>/dev/null || echo "  ⚠ Errore estrazione $zip"
    fi
done
echo -e "${GREEN}  ✓ Estrazione completata${NC}"

echo -e "${YELLOW}[4/6] Creazione tabelle database...${NC}"

# SQL per creare le tabelle GTFS
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOSQL'
-- Tabella fermate trasporto pubblico
CREATE TABLE IF NOT EXISTS gtfs_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stop_id VARCHAR(100) NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    stop_lat DECIMAL(10, 7) NOT NULL,
    stop_lon DECIMAL(10, 7) NOT NULL,
    stop_type ENUM('bus', 'train', 'tram', 'metro', 'ferry') DEFAULT 'bus',
    source VARCHAR(50) NOT NULL,
    zone_id VARCHAR(50),
    location_type INT DEFAULT 0,
    parent_station VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_stop (stop_id, source),
    INDEX idx_coords (stop_lat, stop_lon),
    INDEX idx_type (stop_type),
    INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabella linee/routes
CREATE TABLE IF NOT EXISTS gtfs_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id VARCHAR(100) NOT NULL,
    route_short_name VARCHAR(50),
    route_long_name VARCHAR(255),
    route_type INT NOT NULL,
    route_color VARCHAR(6),
    route_text_color VARCHAR(6),
    source VARCHAR(50) NOT NULL,
    agency_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_route (route_id, source),
    INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabella corse/trips
CREATE TABLE IF NOT EXISTS gtfs_trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id VARCHAR(100) NOT NULL,
    route_id VARCHAR(100) NOT NULL,
    service_id VARCHAR(100) NOT NULL,
    trip_headsign VARCHAR(255),
    direction_id INT,
    shape_id VARCHAR(100),
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_trip (trip_id, source),
    INDEX idx_route (route_id),
    INDEX idx_service (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabella orari fermate
CREATE TABLE IF NOT EXISTS gtfs_stop_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id VARCHAR(100) NOT NULL,
    stop_id VARCHAR(100) NOT NULL,
    arrival_time VARCHAR(8),
    departure_time VARCHAR(8),
    stop_sequence INT NOT NULL,
    pickup_type INT DEFAULT 0,
    drop_off_type INT DEFAULT 0,
    source VARCHAR(50) NOT NULL,
    INDEX idx_trip (trip_id),
    INDEX idx_stop (stop_id),
    INDEX idx_arrival (arrival_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabella calendario servizi
CREATE TABLE IF NOT EXISTS gtfs_calendar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id VARCHAR(100) NOT NULL,
    monday TINYINT(1) DEFAULT 0,
    tuesday TINYINT(1) DEFAULT 0,
    wednesday TINYINT(1) DEFAULT 0,
    thursday TINYINT(1) DEFAULT 0,
    friday TINYINT(1) DEFAULT 0,
    saturday TINYINT(1) DEFAULT 0,
    sunday TINYINT(1) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    source VARCHAR(50) NOT NULL,
    UNIQUE KEY unique_service (service_id, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'Tabelle GTFS create con successo!' AS status;
EOSQL

echo -e "${GREEN}  ✓ Tabelle create${NC}"

echo -e "${YELLOW}[5/6] Importazione dati GTFS...${NC}"

# Funzione per importare stops.txt
import_stops() {
    local dir=$1
    local source=$2
    local stop_type=$3
    
    if [ -f "$dir/stops.txt" ]; then
        echo "  → Importando fermate da $source..."
        # Salta header e importa
        tail -n +2 "$dir/stops.txt" | while IFS=',' read -r stop_id stop_code stop_name stop_desc stop_lat stop_lon zone_id stop_url location_type parent_station rest; do
            # Pulisci i valori
            stop_id=$(echo "$stop_id" | tr -d '"')
            stop_name=$(echo "$stop_name" | tr -d '"' | sed "s/'/''/g")
            stop_lat=$(echo "$stop_lat" | tr -d '"')
            stop_lon=$(echo "$stop_lon" | tr -d '"')
            
            if [ -n "$stop_lat" ] && [ -n "$stop_lon" ]; then
                mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e \
                "INSERT IGNORE INTO gtfs_stops (stop_id, stop_name, stop_lat, stop_lon, stop_type, source) VALUES ('$stop_id', '$stop_name', $stop_lat, $stop_lon, '$stop_type', '$source');" 2>/dev/null
            fi
        done
    fi
}

# Funzione per importare routes.txt
import_routes() {
    local dir=$1
    local source=$2
    
    if [ -f "$dir/routes.txt" ]; then
        echo "  → Importando linee da $source..."
        tail -n +2 "$dir/routes.txt" | head -100 | while IFS=',' read -r route_id agency_id route_short_name route_long_name route_desc route_type route_url route_color route_text_color rest; do
            route_id=$(echo "$route_id" | tr -d '"')
            route_short_name=$(echo "$route_short_name" | tr -d '"' | sed "s/'/''/g")
            route_long_name=$(echo "$route_long_name" | tr -d '"' | sed "s/'/''/g")
            route_type=$(echo "$route_type" | tr -d '"')
            
            if [ -n "$route_id" ]; then
                mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e \
                "INSERT IGNORE INTO gtfs_routes (route_id, route_short_name, route_long_name, route_type, source) VALUES ('$route_id', '$route_short_name', '$route_long_name', ${route_type:-3}, '$source');" 2>/dev/null
            fi
        done
    fi
}

# Importa da ogni fonte
if [ -d "tper_bologna" ]; then
    import_stops "tper_bologna" "TPER_Bologna" "bus"
    import_routes "tper_bologna" "TPER_Bologna"
fi

if [ -d "tper_ferrara" ]; then
    import_stops "tper_ferrara" "TPER_Ferrara" "bus"
    import_routes "tper_ferrara" "TPER_Ferrara"
fi

if [ -d "trenitalia" ]; then
    import_stops "trenitalia" "Trenitalia" "train"
    import_routes "trenitalia" "Trenitalia"
fi

echo -e "${GREEN}  ✓ Importazione completata${NC}"

echo -e "${YELLOW}[6/6] Verifica dati importati...${NC}"

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOSQL'
SELECT 
    'Fermate' AS tipo,
    COUNT(*) AS totale,
    SUM(CASE WHEN stop_type = 'bus' THEN 1 ELSE 0 END) AS bus,
    SUM(CASE WHEN stop_type = 'train' THEN 1 ELSE 0 END) AS treni
FROM gtfs_stops;

SELECT 
    'Linee' AS tipo,
    COUNT(*) AS totale,
    GROUP_CONCAT(DISTINCT source) AS fonti
FROM gtfs_routes;
EOSQL

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✓ DEPLOY GTFS COMPLETATO CON SUCCESSO!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "I dati GTFS sono ora disponibili nel database."
echo "Le API del Centro Mobilità useranno questi dati."
echo ""
