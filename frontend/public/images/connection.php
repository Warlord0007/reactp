<?php
    $servername = "localhost";
    $username = "root";
    $password = "";
    $db = "vastra_db";
    $conn = mysqli_connect($servername,$username,$password,$db);
    if($conn){
        echo "connected";
    }
?>