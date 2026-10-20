package com.securepass.ui

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.securepass.crypto.SecurePassEngine

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SecurePassScreen() {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    var masterSecret by remember { mutableStateOf("") }
    var accountIdentifier by remember { mutableStateOf("") }
    var passwordLength by remember { mutableFloatStateOf(16f) }
    var selectedProfile by remember { mutableStateOf("full") }
    var showSecret by remember { mutableStateOf(false) }
    var derivedPassword by remember { mutableStateOf<String?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF07090E))
            .padding(16.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // Personal Branding Header
        Text(
            text = "SecurePass",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            fontFamily = FontFamily.Monospace
        )
        Text(
            text = "Developed by Mohit Prajapati",
            fontSize = 12.sp,
            color = Color(0xFF10B981),
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
        )

        // Generator Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // 1. Master Secret
                Text(
                    text = "1. Master Secret",
                    color = Color(0xFFE2E8F0),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                OutlinedTextField(
                    value = masterSecret,
                    onValueChange = { masterSecret = it; errorMessage = null },
                    placeholder = { Text("Private master passphrase", color = Color(0xFF64748B)) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp, bottom = 12.dp),
                    visualTransformation = if (showSecret) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { showSecret = !showSecret }) {
                            Icon(
                                imageVector = if (showSecret) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = if (showSecret) "Hide Secret" else "Show Secret",
                                tint = Color(0xFF94A3B8)
                            )
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF10B981),
                        unfocusedBorderColor = Color(0xFF334155)
                    ),
                    singleLine = true
                )

                // 2. Account Identifier (Optional)
                Text(
                    text = "2. Website / Identifier (Optional)",
                    color = Color(0xFFE2E8F0),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                OutlinedTextField(
                    value = accountIdentifier,
                    onValueChange = { accountIdentifier = it; errorMessage = null },
                    placeholder = { Text("e.g. github.com (leave blank for default)", color = Color(0xFF64748B)) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp, bottom = 12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF06B6D4),
                        unfocusedBorderColor = Color(0xFF334155)
                    ),
                    singleLine = true
                )

                // 3. Length Slider
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "3. Length: ${passwordLength.toInt()} chars",
                        color = Color(0xFFE2E8F0),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Slider(
                    value = passwordLength,
                    onValueChange = { passwordLength = it },
                    valueRange = 8f..64f,
                    steps = 56,
                    colors = SliderDefaults.colors(
                        thumbColor = Color(0xFF10B981),
                        activeTrackColor = Color(0xFF10B981)
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Error Message if any
                errorMessage?.let {
                    Text(
                        text = it,
                        color = Color(0xFFF87171),
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                // Generate Button
                Button(
                    onClick = {
                        if (masterSecret.trim().isEmpty()) {
                            errorMessage = "Please enter your master secret."
                            return@Button
                        }
                        try {
                            derivedPassword = SecurePassEngine.derivePassword(
                                masterSecret = masterSecret,
                                accountIdentifier = accountIdentifier,
                                length = passwordLength.toInt(),
                                profile = selectedProfile
                            )
                            errorMessage = null
                        } catch (e: Exception) {
                            errorMessage = e.message ?: "Derivation failed"
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Generate Password", color = Color(0xFF020617), fontWeight = FontWeight.Bold)
                }
            }
        }

        // Output Display Card
        derivedPassword?.let { pwd ->
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF020617))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Derived Password",
                        color = Color(0xFF10B981),
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = pwd,
                        color = Color(0xFF38BDF8),
                        fontSize = 18.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                    Button(
                        onClick = {
                            clipboardManager.setText(AnnotatedString(pwd))
                            Toast.makeText(context, "Password copied to clipboard!", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Copy to Clipboard", color = Color.White)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Privacy note
        Text(
            text = "Zero-Storage: Master secrets and derived passwords are computed locally via PBKDF2. No network requests are made.",
            color = Color(0xFF64748B),
            fontSize = 11.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
    }
}
