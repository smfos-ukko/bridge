<?php

if (!isset($_GET['url'])) {
    http_response_code(400);
    exit("Missing URL");
}

$url = $_GET['url'];

$html = file_get_contents($url);

echo $html;

?>