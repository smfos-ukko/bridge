<?php

$allowedOrigins = [
    'http://127.0.0.1:8000',
    'https://crazypiikkis.fi'
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();

$db = new PDO('sqlite:' . __DIR__ . '/../../private/data.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        token TEXT
    );

    CREATE TABLE IF NOT EXISTS systems (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        name TEXT,
        data TEXT,
        created_at TEXT,
        updated_at TEXT
    );
");

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$input['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($input['token'] == $user['token']) {
            $_SESSION['user_id'] = $user['id'];
        } else {
            jsonResponse(['error' => 'unauthorized'], 401);
        }
    }
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'signup':
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input['username'] || !$input['password']) {
            jsonResponse(['error' => 'missing fields'], 400);
        } 

        $hash = password_hash($input['password'], PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(32));

        try {
            $stmt = $db->prepare("INSERT INTO users (username, password_hash, token) VALUES (?, ?, ?)");
            $stmt->execute([$input['username'], $hash, $token]);
            jsonResponse(['status' => 'ok']);
        } catch (PDOException $e) {
            echo $e;
            jsonResponse(['error'=> 'username taken'], 400);
        }
        break;

    case 'login':
        $input = json_decode(file_get_contents('php://input'), true);

        $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$input['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($input['password'], $user['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['token'] = $user['token'];
            $_SESSION['username'] = $user['username'];
            jsonResponse(['status' => 'ok', 'token' => $user['token']]);
        } else {
            jsonResponse(['error' => 'invalid'], 401);
        }
        break;

    case 'logout':
        session_destroy();
        jsonResponse(['status' => 'ok']);
        break;

    case 'checksession':
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (isset($_SESSION['user_id'])) {
            jsonResponse([
                'user' => $_SESSION['username'],
                'token' => $_SESSION['token']
            ]);
        } else {
            jsonResponse(['user' => null]);
        }
        break;

    case 'savesystem':
        $input = json_decode(file_get_contents('php://input'), true);

        checkAuth();

        $stmt = $db->prepare("SELECT * FROM systems WHERE user_id = ? AND name = ?");
        $stmt->execute([$_SESSION['user_id'], $input['name']]);
        $system = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($system) {
            $stmt = $db->prepare("
                UPDATE systems 
                SET 
                    data = ?,
                    updated_at = datetime('now')
                WHERE user_id = ? AND name = ?
            ");
            $stmt->execute([
                json_encode($input['data']),
                $_SESSION['user_id'],
                $input['name']
            ]);

            jsonResponse(['status' => 'updated']);
        } else {
            $stmt = $db->prepare("
                INSERT INTO systems (user_id, name, data, created_at, updated_at)
                VALUES (?, ?, ?, datetime('now'), datetime('now'))
            ");
            $stmt->execute([
                $_SESSION['user_id'],
                $input['name'],
                json_encode($input['data'])
            ]);
            jsonResponse(['status' => 'saved']);
        }
        break;

    case 'loadsystem':
        $input = json_decode(file_get_contents('php://input'), true);

        checkAuth();

        $stmt = $db->prepare("
            SELECT id, name, data, updated_at
            FROM systems
            WHERE user_id = ?
            ORDER BY updated_at DESC
        ");

        $stmt->execute([$_SESSION['user_id']]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$row) {
            $row['data'] = json_decode($row['data'], true);
        }

        jsonResponse($rows);
        break;
    
    case 'deletesystem':
        $input = json_decode(file_get_contents('php://input'), true);

        checkAuth();

        $stmt = $db->prepare("
            SELECT id, name
            FROM systems
            WHERE user_id = ? AND name = ?
        ");

        $stmt->execute([$_SESSION['user_id'], $input['name']]);
        $system = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$system) {
            jsonResponse(['error' => 'system not found'], 401);
        } else {
            $stmt = $db->prepare("
                DELETE
                FROM systems
                WHERE id = ?
            ");

            $stmt->execute([$system['id']]);

            jsonResponse(['status' => 'deleted']);
        }

        break;

    default:
        jsonResponse(['error' => 'unknown action'], 404);
}