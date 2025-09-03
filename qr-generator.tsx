"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Copy, Check, Code } from "lucide-react"
import QRCode from "qrcode"

interface EMVData {
  merchantGuid: string
  merchantName: string
  merchantCity: string
  merchantCategoryCode: string
  transactionCurrency: string
  countryCode: string
  tipAmount: string
  billReference: string
  terminalId: string
  additionalInfo: string
}

export default function Component() {
  const [emvData, setEmvData] = useState<EMVData>({
    merchantGuid: "NCHL000000024501COP-1195-APP-1",
    merchantName: "Hari Sankar Pandey",
    merchantCity: "KATHMANDU",
    merchantCategoryCode: "4829",
    transactionCurrency: "524",
    countryCode: "NP",
    tipAmount: "0",
    billReference: "001011160000072",
    terminalId: "1",
    additionalInfo: "Demo Transaction",
  })

  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [emvString, setEmvString] = useState("")
  const [copied, setCopied] = useState(false)

  // CRC-CCITT-FALSE implementation
  const calculateCRC = (data: string): string => {
    const polynomial = 0x1021
    let crc = 0xffff

    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8

      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial
        } else {
          crc = crc << 1
        }
        crc &= 0xffff
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0")
  }

  // Format EMV field: ID + LENGTH + VALUE
  const formatField = (id: string, value: string): string => {
    const length = value.length.toString().padStart(2, "0")
    return `${id}${length}${value}`
  }

  const generateEMVQR = (): string => {
    // EMV Standard Fields
    const payloadFormatIndicator = formatField("00", "01")
    const pointOfInitiation = formatField("01", "11")

    // Field 29: Merchant Account Information
    const merchantGuid = formatField("00", emvData.merchantGuid)
    const field29 = formatField("29", merchantGuid)

    // Transaction Details
    const merchantCategoryCode = formatField("52", emvData.merchantCategoryCode)
    const transactionCurrency = formatField("53", emvData.transactionCurrency)
    const tipFixed = formatField("54", emvData.tipAmount)
    const countryCode = formatField("58", emvData.countryCode)
    const merchantName = formatField("59", emvData.merchantName)
    const merchantCity = formatField("60", emvData.merchantCity)


//     Additional Data Template			
// 	01	Bill Number	Eg:123456789
// 	02	Mobile Number	9851000000
// 	03	Store Label	
// 	04	Loyalty Number	
// 	05	Reference Label	
// 	06	Customer Label	9999
// 	07	Terminal Label	00123456963210236542
// 	08	Purpose of Transaction	P2P
// 	09	Additional Consumer Data	
// 04			"Calculated Check Sum
// Eg: F01D"

    // Field 62: Additional Data Field
    const subfield01 = formatField("01","01" )
    const subfield02 = formatField("02", "02")

    const subfield03 = formatField("03", "03")
    const subfield04 = formatField("04", "04")
    const subfield05 = formatField("05", "05")
    const subfield06 = formatField("06", "06")
    const subfield07 = formatField("07", '07')
    const subfield08 = formatField("08", '08')
    const subfield09 = formatField("09", '09')
    const field62 = formatField("62", subfield01 + subfield02 + subfield03 + subfield04 + subfield05 + subfield06 + subfield07 + subfield08 + subfield09)

    // Assemble QR payload (excluding CRC)
    const qrPayload =
      payloadFormatIndicator +
      pointOfInitiation +
      field29 +
      merchantCategoryCode +
      transactionCurrency +
      tipFixed +
      countryCode +
      merchantName +
      merchantCity +
      field62

    // Calculate CRC
    const crc = calculateCRC(qrPayload + "6304")

    // Final QR string with CRC field
    const qrString = qrPayload + formatField("63", crc)

    return qrString
  }

  const generateQRCode = async () => {
    try {
      const emvQrString = generateEMVQR()
      setEmvString(emvQrString)

      const url = await QRCode.toDataURL(emvQrString, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      })

      setQrCodeUrl(url)
    } catch (error) {
      console.error("Error generating QR code:", error)
      setQrCodeUrl("")
    }
  }

  useEffect(() => {
    generateQRCode()
  }, [emvData])

  const updateEMVData = (field: keyof EMVData, value: string) => {
    setEmvData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.download = `emv-qr-${emvData.merchantName.replace(/\s+/g, "-")}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const copyEMVString = async () => {
    try {
      await navigator.clipboard.writeText(emvString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-red-100 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">EMV QR Code Generator</h1>
          <p className="text-gray-600">Generate EMV-compliant QR codes for payment processing</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Merchant Information</CardTitle>
                <CardDescription>Basic merchant details for EMV QR code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="merchantGuid">Merchant GUID</Label>
                  <Input
                    id="merchantGuid"
                    value={emvData.merchantGuid}
                    onChange={(e) => updateEMVData("merchantGuid", e.target.value)}
                    placeholder="NCHL000000014501MER-1-APP-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="merchantName">Merchant Name</Label>
                  <Input
                    id="merchantName"
                    value={emvData.merchantName}
                    onChange={(e) => updateEMVData("merchantName", e.target.value)}
                    placeholder="Enter merchant name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="merchantCity">City</Label>
                    <Input
                      id="merchantCity"
                      value={emvData.merchantCity}
                      onChange={(e) => updateEMVData("merchantCity", e.target.value)}
                      placeholder="KATHMANDU"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code</Label>
                    <Select value={emvData.countryCode} onValueChange={(value) => updateEMVData("countryCode", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NP">Nepal (NP)</SelectItem>
                        <SelectItem value="IN">India (IN)</SelectItem>
                        <SelectItem value="US">United States (US)</SelectItem>
                        <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="merchantCategoryCode">Category Code</Label>
                    <Input
                      id="merchantCategoryCode"
                      value={emvData.merchantCategoryCode}
                      onChange={(e) => updateEMVData("merchantCategoryCode", e.target.value)}
                      placeholder="4829"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionCurrency">Currency Code</Label>
                    <Select
                      value={emvData.transactionCurrency}
                      onValueChange={(value) => updateEMVData("transactionCurrency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="524">NPR (524)</SelectItem>
                        <SelectItem value="356">INR (356)</SelectItem>
                        <SelectItem value="840">USD (840)</SelectItem>
                        <SelectItem value="826">GBP (826)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>Additional transaction information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipAmount">Tip Amount</Label>
                    <Input
                      id="tipAmount"
                      value={emvData.tipAmount}
                      onChange={(e) => updateEMVData("tipAmount", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terminalId">Terminal ID</Label>
                    <Input
                      id="terminalId"
                      value={emvData.terminalId}
                      onChange={(e) => updateEMVData("terminalId", e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billReference">Bill Reference</Label>
                  <Input
                    id="billReference"
                    value={emvData.billReference}
                    onChange={(e) => updateEMVData("billReference", e.target.value)}
                    placeholder="001011160000072"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Input
                    id="additionalInfo"
                    value={emvData.additionalInfo}
                    onChange={(e) => updateEMVData("additionalInfo", e.target.value)}
                    placeholder="P2P Fund Transfer"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Code Display */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated EMV QR Code</CardTitle>
                <CardDescription>EMV-compliant QR code with CRC validation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  {qrCodeUrl ? (
                    <div className="text-center space-y-4">
                      <img
                        src={qrCodeUrl || "/placeholder.svg"}
                        alt="EMV QR Code"
                        className="border rounded-lg shadow-sm bg-white p-4 max-w-full"
                      />
                      <div className="flex gap-2">
                        <Button onClick={downloadQRCode} className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button onClick={copyEMVString} variant="outline" className="flex-1">
                          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                          {copied ? "Copied!" : "Copy EMV"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📱</div>
                        <p>EMV QR Code will appear here</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    Payment Summary:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Merchant:</span> {emvData.merchantName}
                    </p>
                    <p>
                      <span className="font-medium">City:</span> {emvData.merchantCity}
                    </p>
                    <p>
                      <span className="font-medium">Category:</span> {emvData.merchantCategoryCode}
                    </p>
                    <p>
                      <span className="font-medium">Currency:</span> {emvData.transactionCurrency}
                    </p>
                    <p>
                      <span className="font-medium">Reference:</span> {emvData.billReference}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>EMV String</CardTitle>
                <CardDescription>Raw EMV QR code string with CRC</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={emvString}
                  readOnly
                  rows={6}
                  className="font-mono text-xs"
                  placeholder="EMV string will appear here..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
